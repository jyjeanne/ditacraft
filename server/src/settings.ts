import { Connection } from 'vscode-languageserver/node';
import { RuleCategory } from './utils/types';

/**
 * DitaCraft LSP server settings
 * Synced from the client via workspace/configuration
 */
export interface DitaCraftSettings {
    autoValidate: boolean;
    validationDebounceMs: number;
    /** Validation engine: 'built-in' | 'typesxml' | 'xmllint' */
    validationEngine: 'built-in' | 'typesxml' | 'xmllint';
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
    /** Override auto-detected DITA version ('auto' | '1.0' | '1.1' | '1.2' | '1.3' | '2.0'). */
    ditaVersion: 'auto' | '1.0' | '1.1' | '1.2' | '1.3' | '2.0';
    /** Schema format for validation: 'dtd' (default) or 'rng' (requires salve-annos). */
    schemaFormat: 'dtd' | 'rng';
    /** Path to directory containing RNG schema files (e.g., DITA-OT's schema directory). */
    rngSchemaPath: string;
    /** Path to an external OASIS XML catalog file for custom DTD resolution. */
    xmlCatalogPath: string;
    /** Per-rule severity overrides. Maps diagnostic code → severity name. */
    validationSeverityOverrides: Record<string, 'error' | 'warning' | 'information' | 'hint' | 'off'>;
    /** Path to a JSON file containing custom validation rules. */
    customRulesFile: string;
    /** File size threshold (KB) above which heavy validation phases are skipped. */
    largeFileThresholdKB: number;
    /** Total pipeline execution budget (ms). Remaining phases are skipped when exceeded. */
    pipelineBudgetMs: number;
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
    ditaVersion: 'auto',
    schemaFormat: 'dtd',
    rngSchemaPath: '',
    xmlCatalogPath: '',
    validationSeverityOverrides: {},
    customRulesFile: '',
    largeFileThresholdKB: 500,
    pipelineBudgetMs: 30_000,
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

export function updateGlobalSettings(settings: Partial<DitaCraftSettings>): void {
    globalSettings = { ...defaultSettings, ...settings };
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
        }).then((conf: Partial<DitaCraftSettings>) => ({
            ...defaultSettings,
            ...conf,
        }));
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
