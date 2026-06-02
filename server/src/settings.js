"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSettings = initSettings;
exports.getGlobalSettings = getGlobalSettings;
exports.updateGlobalSettings = updateGlobalSettings;
exports.getDocumentSettings = getDocumentSettings;
exports.clearDocumentSettings = clearDocumentSettings;
const defaultSettings = {
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
    pipelineBudgetMs: 30000,
};
// Cache of settings per document URI
const documentSettings = new Map();
let globalSettings = defaultSettings;
let hasConfigurationCapability = false;
let connection;
function initSettings(conn, hasConfig) {
    connection = conn;
    hasConfigurationCapability = hasConfig;
}
function getGlobalSettings() {
    return globalSettings;
}
function updateGlobalSettings(settings) {
    globalSettings = { ...defaultSettings, ...settings };
}
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'ditacraft'
        }).then((conf) => ({
            ...defaultSettings,
            ...conf,
        }));
        documentSettings.set(resource, result);
    }
    return result;
}
function clearDocumentSettings(uri) {
    if (uri) {
        documentSettings.delete(uri);
    }
    else {
        documentSettings.clear();
    }
}
//# sourceMappingURL=settings.js.map