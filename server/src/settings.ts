import { Connection } from 'vscode-languageserver/node';

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
}

const defaultSettings: DitaCraftSettings = {
    autoValidate: true,
    validationDebounceMs: 300,
    validationEngine: 'typesxml',
    keySpaceCacheTtlMinutes: 5,
    maxLinkMatches: 10000,
    maxNumberOfProblems: 100,
    logLevel: 'info',
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
