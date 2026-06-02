/**
 * Default DitaCraftSettings for use in the MCP server.
 * Mirrors the LSP server's defaultSettings but avoids VS Code connection dependency.
 */
import { DitaCraftSettings } from '../../server/src/settings';

export function defaultMcpSettings(): DitaCraftSettings {
    return {
        autoValidate: false,
        validationDebounceMs: 0,
        validationEngine: 'typesxml',
        keySpaceCacheTtlMinutes: 5,
        maxLinkMatches: 10000,
        maxNumberOfProblems: 100,
        logLevel: 'warn',
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
}
