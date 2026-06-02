/**
 * DitaCraft MCP Server — entry point.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import { z } from 'zod';

import { log, setLevel } from './logger';
import { DiagnosticsStore } from './diagnosticsStore';
import { McpContext } from './types';

export type { McpContext };

import { CatalogValidationService } from '../../server/src/services/catalogValidationService';
import { RngValidationService } from '../../server/src/services/rngValidationService';
import { ValidationPipeline } from '../../server/src/services/validationPipeline';
import { KeySpaceService } from '../../server/src/services/keySpaceService';
import { SubjectSchemeService } from '../../server/src/services/subjectSchemeService';

// ── Environment ────────────────────────────────────────────────────────────

const workspaceRoot = process.env.WORKSPACE;
if (!workspaceRoot || workspaceRoot.trim() === '') {
    process.stderr.write('[ditacraft-mcp] FATAL: WORKSPACE environment variable is required\n');
    process.exit(1);
}

const logLevel = (process.env.DITACRAFT_LOG_LEVEL || 'warn') as 'debug' | 'info' | 'warn' | 'error';
setLevel(logLevel);

const extensionRoot = path.resolve(__dirname, '..');

// ── Service Initialization ─────────────────────────────────────────────────

const subjectSchemeService = new SubjectSchemeService();

const catalogService = new CatalogValidationService();
catalogService.initialize(extensionRoot);
if (catalogService.isAvailable) {
    log('info', 'TypesXML catalog validation initialized (DITA 1.2/1.3/2.0)');
} else if (catalogService.error) {
    log('warn', `TypesXML not available: ${catalogService.error}`);
}

const rngService = new RngValidationService();
rngService.initialize();

const validationPipeline = new ValidationPipeline(
    catalogService,
    rngService,
    subjectSchemeService,
    (msg) => log('debug', msg),
);

const keySpaceService = new KeySpaceService(
    [workspaceRoot],
    async () => ({
        keySpaceCacheTtlMinutes: parseInt(process.env.DITACRAFT_KEYSPACE_TTL_MINUTES || '5', 10),
        maxLinkMatches: 10000,
    }),
    (msg) => log('debug', msg),
);

const diagnosticsStore = new DiagnosticsStore();

const ctx: McpContext = {
    workspaceRoot,
    extensionRoot,
    validationPipeline,
    keySpaceService,
    catalogService,
    subjectSchemeService,
    diagnosticsStore,
};

// ── MCP Server ─────────────────────────────────────────────────────────────

const server = new McpServer({
    name: 'ditacraft-mcp',
    version: '0.8.0',
    description: 'DitaCraft MCP Server — DITA validation, key space, snapshots, and map analysis',
});

// ── Tools ──────────────────────────────────────────────────────────────────

server.registerTool(
    'dita_validate',
    {
        description: 'Validate a DITA file or XML fragment and return diagnostics.',
        inputSchema: z.object({
            uri: z.string().optional().describe('File to validate. Relative to workspace or file:// URI.'),
            fragment: z.string().optional().describe('Raw XML string to validate in-memory.'),
            fragmentType: z.enum(['map', 'topic', 'topicref', 'element']).optional()
                .describe('Required when fragment is provided.'),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaValidate } = await import('./tools/ditaValidate');
        const result = await handleDitaValidate(args, ctx);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'dita_context_snapshot',
    {
        description: 'Return a token-budgeted text representation of a DITA map for LLM injection.',
        inputSchema: z.object({
            uri: z.string().describe('Map file to snapshot.'),
            maxTokens: z.number().optional().default(8000),
            strategy: z.enum(['breadth-first', 'depth-first', 'by-relevance']).optional().default('breadth-first'),
            focusUri: z.string().optional(),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaContextSnapshot } = await import('./tools/ditaContextSnapshot');
        const result = await handleDitaContextSnapshot(args, ctx);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'dita_key_space',
    {
        description: 'List all defined keys and their resolved targets from the key space.',
        inputSchema: z.object({
            mapUri: z.string().optional().describe('Root map file (auto-discovered if omitted).'),
            includeScopes: z.boolean().optional().default(true),
            includeProvenance: z.boolean().optional().default(false),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaKeySpace } = await import('./tools/ditaKeySpace');
        const result = await handleDitaKeySpace(args, ctx);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'dita_map_structure',
    {
        description: 'Return the full topic hierarchy and metadata for a DITA map.',
        inputSchema: z.object({
            mapUri: z.string().describe('Map file to analyze.'),
            depth: z.number().optional().default(4),
            includeMetadata: z.boolean().optional().default(true),
            format: z.enum(['json', 'tree', 'csv']).optional().default('json'),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaMapStructure } = await import('./tools/ditaMapStructure');
        const result = await handleDitaMapStructure(args, ctx);
        return { content: [{ type: 'text' as const, text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'dita_resolve_reference',
    {
        description: 'Resolve an href, keyref, conref, or conkeyref to its target file and element.',
        inputSchema: z.object({
            fromUri: z.string().optional().describe('Source file URI for relative path resolution.'),
            reference: z.string().describe('The attribute value.'),
            referenceType: z.enum(['href', 'keyref', 'conref', 'conkeyref']).describe('Type of reference.'),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaResolveReference } = await import('./tools/ditaResolveReference');
        const result = await handleDitaResolveReference(args, ctx);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'dita_explain_key',
    {
        description: 'Return a detailed trace of how a key resolves through scopes and keyref chains.',
        inputSchema: z.object({
            keyName: z.string().describe('The key name to trace.'),
            contextFilePath: z.string().describe('The file from which the key is referenced.'),
        }).passthrough(),
    },
    async (args) => {
        const { handleDitaExplainKey } = await import('./tools/ditaExplainKey');
        const result = await handleDitaExplainKey(args, ctx);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
);

// ── Resources ──────────────────────────────────────────────────────────────

server.registerResource(
    'workspace-maps',
    'dita://workspace/maps',
    {
        description: 'List all DITA maps discovered in the workspace.',
        mimeType: 'application/json',
    },
    async () => {
        const { readMapsResource } = await import('./resources/maps');
        const data = await readMapsResource(ctx);
        return { contents: [{ uri: 'dita://workspace/maps', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
    },
);

server.registerResource(
    'workspace-diagnostics',
    'dita://workspace/diagnostics',
    {
        description: 'Current validation diagnostics across workspace files.',
        mimeType: 'application/json',
    },
    async (uri) => {
        const { readDiagnosticsResource } = await import('./resources/diagnostics');
        const url = new URL(uri instanceof URL ? uri.href : String(uri));
        const params: Record<string, string> = {};
        url.searchParams.forEach((v, k) => { params[k] = v; });
        const data = await readDiagnosticsResource(params, ctx);
        return { contents: [{ uri: 'dita://workspace/diagnostics', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
    },
);

server.registerResource(
    'workspace-keys',
    'dita://workspace/keys',
    {
        description: 'All defined keys with their resolved targets.',
        mimeType: 'application/json',
    },
    async (uri) => {
        const { readKeysResource } = await import('./resources/keys');
        const url = new URL(typeof uri === 'string' ? uri : uri.href);
        const params: Record<string, string> = {};
        url.searchParams.forEach((v, k) => { params[k] = v; });
        const data = await readKeysResource(params, ctx);
        return { contents: [{ uri: 'dita://workspace/keys', mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
    },
);

// ── Startup ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log('info', `MCP server started (workspace: ${workspaceRoot})`);
}

main().catch((err) => {
    log('error', `Failed to start MCP server: ${String(err)}`);
    process.exit(1);
});
