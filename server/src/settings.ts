import { Connection } from 'vscode-languageserver/node';
import { RuleCategory } from './features/ditaRulesValidator';

/**
 * DitaCraft LSP server settings
 * Synced from the client via workspace/configuration
 */
export interface DitaCraftSettings {
    autoValidate: boolean;
    validationDebounceMs: number;
    validationEngine: string;
    keySpaceCacheTtlMinutes: number;
    maxLinkMatches: number;
    maxNumberOfProblems: number;
    logLevel: string;

    /** Enable DITA rules validation (Schematron-equivalent). */
    ditaRulesEnabled: boolean;
    /** Which rule categories to enable. */
    ditaRulesCategories: RuleCategory[];
    /** Enable cross-reference validation. */
    crossRefValidationEnabled: boolean;
    /** Enable subject scheme controlled value validation. */
    subjectSchemeValidationEnabled: boolean;
}

const defaultSettings: DitaCraftSettings = {
    autoValidate: true,
    validationDebounceMs: 300,
    validationEngine: 'built-in',
    keySpaceCacheTtlMinutes: 5,
    maxLinkMatches: 10000,
    maxNumberOfProblems: 100,
    logLevel: 'info',
    ditaRulesEnabled: true,
    ditaRulesCategories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    crossRefValidationEnabled: true,
    subjectSchemeValidationEnabled: true,
};

// Cache of settings per document URI
const documentSettings: Map<string, Thenable<DitaCraftSettings>> = new Map();

let globalSettings: DitaCraftSettings = defaultSettings;
let hasConfigurationCapability = false;
let connection: Connection;

export function initSettings(conn: Connection, hasConfig: boolean): void {
    connection = conn;
    hasConfigurationCapability = hasConfig;
}

export function getGlobalSettings(): DitaCraftSettings {
    return globalSettings;
}

export function updateGlobalSettings(settings: DitaCraftSettings): void {
    globalSettings = settings;
}

export function getDocumentSettings(resource: string): Thenable<DitaCraftSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'ditacraft'
        }) ?? Promise.resolve(globalSettings);
        documentSettings.set(resource, result);
    }
    return result;
}

export function clearDocumentSettings(uri?: string): void {
    if (uri) {
        documentSettings.delete(uri);
    } else {
        documentSettings.clear();
    }
}
