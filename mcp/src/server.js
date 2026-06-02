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
/**
 * DitaCraft MCP Server — entry point.
 */
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const path = __importStar(require("path"));
const zod_1 = require("zod");
const logger_1 = require("./logger");
const diagnosticsStore_1 = require("./diagnosticsStore");
const catalogValidationService_1 = require("../../server/src/services/catalogValidationService");
const rngValidationService_1 = require("../../server/src/services/rngValidationService");
const validationPipeline_1 = require("../../server/src/services/validationPipeline");
const keySpaceService_1 = require("../../server/src/services/keySpaceService");
const subjectSchemeService_1 = require("../../server/src/services/subjectSchemeService");
// ── Environment ────────────────────────────────────────────────────────────
const workspaceRoot = process.env.WORKSPACE;
if (!workspaceRoot || workspaceRoot.trim() === '') {
    process.stderr.write('[ditacraft-mcp] FATAL: WORKSPACE environment variable is required\n');
    process.exit(1);
}
const logLevel = (process.env.DITACRAFT_LOG_LEVEL || 'warn');
(0, logger_1.setLevel)(logLevel);
const extensionRoot = path.resolve(__dirname, '..');
// ── Service Initialization ─────────────────────────────────────────────────
const subjectSchemeService = new subjectSchemeService_1.SubjectSchemeService();
const catalogService = new catalogValidationService_1.CatalogValidationService();
catalogService.initialize(extensionRoot);
if (catalogService.isAvailable) {
    (0, logger_1.log)('info', 'TypesXML catalog validation initialized (DITA 1.2/1.3/2.0)');
}
else if (catalogService.error) {
    (0, logger_1.log)('warn', `TypesXML not available: ${catalogService.error}`);
}
const rngService = new rngValidationService_1.RngValidationService();
rngService.initialize();
const validationPipeline = new validationPipeline_1.ValidationPipeline(catalogService, rngService, subjectSchemeService, (msg) => (0, logger_1.log)('debug', msg));
const keySpaceService = new keySpaceService_1.KeySpaceService([workspaceRoot], async () => ({
    keySpaceCacheTtlMinutes: parseInt(process.env.DITACRAFT_KEYSPACE_TTL_MINUTES || '5', 10),
    maxLinkMatches: 10000,
}), (msg) => (0, logger_1.log)('debug', msg));
const diagnosticsStore = new diagnosticsStore_1.DiagnosticsStore();
const ctx = {
    workspaceRoot,
    extensionRoot,
    validationPipeline,
    keySpaceService,
    catalogService,
    subjectSchemeService,
    diagnosticsStore,
};
// ── MCP Server ─────────────────────────────────────────────────────────────
const server = new mcp_js_1.McpServer({
    name: 'ditacraft-mcp',
    version: '0.8.0',
    description: 'DitaCraft MCP Server — DITA validation, key space, snapshots, and map analysis',
});
// ── Tools ──────────────────────────────────────────────────────────────────
server.registerTool('dita_validate', {
    description: 'Validate a DITA file or XML fragment and return diagnostics.',
    inputSchema: zod_1.z.object({
        uri: zod_1.z.string().optional().describe('File to validate. Relative to workspace or file:// URI.'),
        fragment: zod_1.z.string().optional().describe('Raw XML string to validate in-memory.'),
        fragmentType: zod_1.z.enum(['map', 'topic', 'topicref', 'element']).optional()
            .describe('Required when fragment is provided.'),
    }).passthrough(),
}, async (args) => {
    const { handleDitaValidate } = await Promise.resolve().then(() => __importStar(require('./tools/ditaValidate')));
    const result = await handleDitaValidate(args, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});
server.registerTool('dita_context_snapshot', {
    description: 'Return a token-budgeted text representation of a DITA map for LLM injection.',
    inputSchema: zod_1.z.object({
        uri: zod_1.z.string().describe('Map file to snapshot.'),
        maxTokens: zod_1.z.number().optional().default(8000),
        strategy: zod_1.z.enum(['breadth-first', 'depth-first', 'by-relevance']).optional().default('breadth-first'),
        focusUri: zod_1.z.string().optional(),
    }).passthrough(),
}, async (args) => {
    const { handleDitaContextSnapshot } = await Promise.resolve().then(() => __importStar(require('./tools/ditaContextSnapshot')));
    const result = await handleDitaContextSnapshot(args, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});
server.registerTool('dita_key_space', {
    description: 'List all defined keys and their resolved targets from the key space.',
    inputSchema: zod_1.z.object({
        mapUri: zod_1.z.string().optional().describe('Root map file (auto-discovered if omitted).'),
        includeScopes: zod_1.z.boolean().optional().default(true),
        includeProvenance: zod_1.z.boolean().optional().default(false),
    }).passthrough(),
}, async (args) => {
    const { handleDitaKeySpace } = await Promise.resolve().then(() => __importStar(require('./tools/ditaKeySpace')));
    const result = await handleDitaKeySpace(args, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});
server.registerTool('dita_map_structure', {
    description: 'Return the full topic hierarchy and metadata for a DITA map.',
    inputSchema: zod_1.z.object({
        mapUri: zod_1.z.string().describe('Map file to analyze.'),
        depth: zod_1.z.number().optional().default(4),
        includeMetadata: zod_1.z.boolean().optional().default(true),
        format: zod_1.z.enum(['json', 'tree', 'csv']).optional().default('json'),
    }).passthrough(),
}, async (args) => {
    const { handleDitaMapStructure } = await Promise.resolve().then(() => __importStar(require('./tools/ditaMapStructure')));
    const result = await handleDitaMapStructure(args, ctx);
    return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
});
server.registerTool('dita_resolve_reference', {
    description: 'Resolve an href, keyref, conref, or conkeyref to its target file and element.',
    inputSchema: zod_1.z.object({
        fromUri: zod_1.z.string().optional().describe('Source file URI for relative path resolution.'),
        reference: zod_1.z.string().describe('The attribute value.'),
        referenceType: zod_1.z.enum(['href', 'keyref', 'conref', 'conkeyref']).describe('Type of reference.'),
    }).passthrough(),
}, async (args) => {
    const { handleDitaResolveReference } = await Promise.resolve().then(() => __importStar(require('./tools/ditaResolveReference')));
    const result = await handleDitaResolveReference(args, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});
server.registerTool('dita_explain_key', {
    description: 'Return a detailed trace of how a key resolves through scopes and keyref chains.',
    inputSchema: zod_1.z.object({
        keyName: zod_1.z.string().describe('The key name to trace.'),
        contextFilePath: zod_1.z.string().describe('The file from which the key is referenced.'),
    }).passthrough(),
}, async (args) => {
    const { handleDitaExplainKey } = await Promise.resolve().then(() => __importStar(require('./tools/ditaExplainKey')));
    const result = await handleDitaExplainKey(args, ctx);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});
// ── Resources ──────────────────────────────────────────────────────────────
server.registerResource('workspace-maps', 'dita://workspace/maps', {
    description: 'List all DITA maps discovered in the workspace.',
    mimeType: 'application/json',
}, async () => {
    const { readMapsResource } = await Promise.resolve().then(() => __importStar(require('./resources/maps')));
    const data = await readMapsResource(ctx);
    return { contents: [{ uri: 'dita://workspace/maps', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});
server.registerResource('workspace-diagnostics', 'dita://workspace/diagnostics', {
    description: 'Current validation diagnostics across workspace files.',
    mimeType: 'application/json',
}, async (uri) => {
    const { readDiagnosticsResource } = await Promise.resolve().then(() => __importStar(require('./resources/diagnostics')));
    const url = new URL(uri instanceof URL ? uri.href : String(uri));
    const params = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    const data = await readDiagnosticsResource(params, ctx);
    return { contents: [{ uri: 'dita://workspace/diagnostics', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});
server.registerResource('workspace-keys', 'dita://workspace/keys', {
    description: 'All defined keys with their resolved targets.',
    mimeType: 'application/json',
}, async (uri) => {
    const { readKeysResource } = await Promise.resolve().then(() => __importStar(require('./resources/keys')));
    const url = new URL(typeof uri === 'string' ? uri : uri.href);
    const params = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    const data = await readKeysResource(params, ctx);
    return { contents: [{ uri: 'dita://workspace/keys', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
});
// ── Startup ────────────────────────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    (0, logger_1.log)('info', `MCP server started (workspace: ${workspaceRoot})`);
}
main().catch((err) => {
    (0, logger_1.log)('error', `Failed to start MCP server: ${String(err)}`);
    process.exit(1);
});
//# sourceMappingURL=server.js.map