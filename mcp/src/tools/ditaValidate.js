"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDitaValidate = handleDitaValidate;
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const workspace_1 = require("../workspace");
const fragmentValidator_1 = require("../../../server/src/features/fragmentValidator");
const logger_1 = require("../logger");
async function handleDitaValidate(args, ctx) {
    const { uri, fragment, fragmentType } = args;
    (0, logger_1.log)('debug', `dita_validate: uri=${uri}, fragment=${fragment ? 'present' : 'none'}`);
    if (!uri && !fragment) {
        return { error: 'Either "uri" or "fragment" is required', isValid: false, filePath: '', diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
    }
    if (fragment && !fragmentType) {
        return { error: '"fragmentType" is required when "fragment" is provided', isValid: false, filePath: '', diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
    }
    const startTime = Date.now();
    let diagnostics = [];
    let filePath = '';
    if (fragment) {
        // Fragment validation
        const result = await (0, fragmentValidator_1.handleValidateFragment)({
            fragment,
            contextUri: `ditacraft-fragment:///fragment.${fragmentType === 'map' ? 'ditamap' : 'dita'}`,
            fragmentType: fragmentType,
        }, ctx.validationPipeline);
        diagnostics = result.diagnostics;
        filePath = '(fragment)';
    }
    else if (uri) {
        // File validation
        const resolvedUri = (0, workspace_1.resolvePath)(uri, ctx.workspaceRoot);
        if (!resolvedUri) {
            return { error: `Invalid or unsafe path: ${uri}`, isValid: false, filePath: uri, diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
        }
        const fsPath = resolvedUri.replace(/^file:\/\/\/?/, '');
        if (!(0, workspace_1.fileExists)(uri, ctx.workspaceRoot)) {
            return { error: `File not found in workspace: ${uri}`, isValid: false, filePath: uri, diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
        }
        const content = fs.readFileSync(fsPath, 'utf-8');
        const ext = path.extname(fsPath).toLowerCase();
        const langId = ext === '.ditamap' ? 'ditamap' : ext === '.bookmap' ? 'bookmap' : 'dita';
        const document = vscode_languageserver_textdocument_1.TextDocument.create(resolvedUri, langId, 0, content);
        filePath = uri;
        // Build settings matching what the LSP server would provide
        const settings = {
            maxNumberOfProblems: 100,
            ditaRulesEnabled: true,
            ditaRulesCategories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
            crossRefValidationEnabled: true,
            subjectSchemeValidationEnabled: true,
            validationSeverityOverrides: {},
            largeFileThresholdKB: 500,
            customRulesFile: '',
            ditaVersion: 'auto',
            schemaFormat: 'dtd',
            rngSchemaPath: '',
            validationEngine: 'typesxml',
            validationDebounceMs: 500,
            keySpaceCacheTtlMinutes: 5,
            maxLinkMatches: 10000,
        };
        diagnostics = await ctx.validationPipeline.validate(document, settings, ctx.keySpaceService, { rootIdIndex: new Map(), unusedTopicPaths: new Set() });
        // Update diagnostics store
        ctx.diagnosticsStore.update(resolvedUri, diagnostics);
    }
    const elapsed = Date.now() - startTime;
    let errorCount = 0;
    let warningCount = 0;
    const serialized = diagnostics.map((d) => {
        const sev = diagnosticSeverity(d.severity);
        if (sev === 'error')
            errorCount++;
        if (sev === 'warning')
            warningCount++;
        return {
            code: typeof d.code === 'string' ? d.code : String(d.code ?? ''),
            message: d.message,
            severity: sev,
            line: d.range.start.line + 1,
            column: d.range.start.character + 1,
            endLine: d.range.end.line + 1,
            endColumn: d.range.end.character + 1,
        };
    });
    (0, logger_1.log)('debug', `Validated "${filePath}": ${errorCount} errors, ${warningCount} warnings (${elapsed}ms)`);
    return {
        isValid: errorCount === 0,
        filePath,
        diagnostics: serialized,
        errorCount,
        warningCount,
        validationTimeMs: elapsed,
    };
}
function diagnosticSeverity(severity) {
    switch (severity) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'information';
        case 4: return 'hint';
        default: return 'information';
    }
}
//# sourceMappingURL=ditaValidate.js.map