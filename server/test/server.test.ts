import * as assert from 'assert';
import {
    InitializeParams,
    FileChangeType,
} from 'vscode-languageserver/node';

import {
    detectClientCapabilities,
    extractWorkspaceFolderPaths,
    buildInitializeResult,
    isMapFile,
    classifyWatchedFileChanges,
} from '../src/serverHandlers';

suite('serverHandlers', () => {

    // ── detectClientCapabilities ────────────────────────────────

    suite('detectClientCapabilities', () => {
        test('detects workspace.configuration capability', () => {
            const params = {
                capabilities: {
                    workspace: { configuration: true, workspaceFolders: false },
                },
            } as unknown as InitializeParams;
            const caps = detectClientCapabilities(params);
            assert.strictEqual(caps.hasConfigurationCapability, true);
            assert.strictEqual(caps.hasWorkspaceFolderCapability, false);
        });

        test('detects workspace.workspaceFolders capability', () => {
            const params = {
                capabilities: {
                    workspace: { configuration: false, workspaceFolders: true },
                },
            } as unknown as InitializeParams;
            const caps = detectClientCapabilities(params);
            assert.strictEqual(caps.hasConfigurationCapability, false);
            assert.strictEqual(caps.hasWorkspaceFolderCapability, true);
        });

        test('handles both capabilities present', () => {
            const params = {
                capabilities: {
                    workspace: { configuration: true, workspaceFolders: true },
                },
            } as unknown as InitializeParams;
            const caps = detectClientCapabilities(params);
            assert.strictEqual(caps.hasConfigurationCapability, true);
            assert.strictEqual(caps.hasWorkspaceFolderCapability, true);
        });

        test('handles missing workspace capability', () => {
            const params = {
                capabilities: {},
            } as unknown as InitializeParams;
            const caps = detectClientCapabilities(params);
            assert.strictEqual(caps.hasConfigurationCapability, false);
            assert.strictEqual(caps.hasWorkspaceFolderCapability, false);
        });

        test('handles undefined workspace property', () => {
            const params = {
                capabilities: { workspace: undefined },
            } as unknown as InitializeParams;
            const caps = detectClientCapabilities(params);
            assert.strictEqual(caps.hasConfigurationCapability, false);
            assert.strictEqual(caps.hasWorkspaceFolderCapability, false);
        });
    });

    // ── extractWorkspaceFolderPaths ─────────────────────────────

    suite('extractWorkspaceFolderPaths', () => {
        test('extracts file system paths from workspace folders', () => {
            const params = {
                capabilities: {},
                workspaceFolders: [
                    { uri: 'file:///home/user/project', name: 'project' },
                ],
            } as unknown as InitializeParams;
            const paths = extractWorkspaceFolderPaths(params);
            assert.strictEqual(paths.length, 1);
            assert.strictEqual(paths[0], '/home/user/project');
        });

        test('returns empty array when no workspace folders', () => {
            const params = {
                capabilities: {},
                workspaceFolders: null,
            } as unknown as InitializeParams;
            const paths = extractWorkspaceFolderPaths(params);
            assert.deepStrictEqual(paths, []);
        });

        test('handles multiple workspace folders', () => {
            const params = {
                capabilities: {},
                workspaceFolders: [
                    { uri: 'file:///home/user/project1', name: 'p1' },
                    { uri: 'file:///home/user/project2', name: 'p2' },
                ],
            } as unknown as InitializeParams;
            const paths = extractWorkspaceFolderPaths(params);
            assert.strictEqual(paths.length, 2);
            assert.strictEqual(paths[0], '/home/user/project1');
            assert.strictEqual(paths[1], '/home/user/project2');
        });

        test('handles undefined workspaceFolders', () => {
            const params = {
                capabilities: {},
            } as unknown as InitializeParams;
            const paths = extractWorkspaceFolderPaths(params);
            assert.deepStrictEqual(paths, []);
        });
    });

    // ── buildInitializeResult ───────────────────────────────────

    suite('buildInitializeResult', () => {
        test('includes all core LSP capabilities', () => {
            const result = buildInitializeResult(false);
            const caps = result.capabilities;

            assert.ok(caps.completionProvider, 'completionProvider');
            assert.ok(caps.hoverProvider, 'hoverProvider');
            assert.ok(caps.documentSymbolProvider, 'documentSymbolProvider');
            assert.ok(caps.workspaceSymbolProvider, 'workspaceSymbolProvider');
            assert.ok(caps.definitionProvider, 'definitionProvider');
            assert.ok(caps.referencesProvider, 'referencesProvider');
            assert.ok(caps.documentFormattingProvider, 'documentFormattingProvider');
            assert.ok(caps.documentRangeFormattingProvider, 'documentRangeFormattingProvider');
            assert.ok(caps.codeActionProvider, 'codeActionProvider');
            assert.ok(caps.foldingRangeProvider, 'foldingRangeProvider');
            assert.ok(caps.documentLinkProvider, 'documentLinkProvider');
            assert.ok(caps.linkedEditingRangeProvider, 'linkedEditingRangeProvider');
        });

        test('includes rename provider with prepare support', () => {
            const result = buildInitializeResult(false);
            const rename = result.capabilities.renameProvider as { prepareProvider: boolean };
            assert.ok(rename, 'renameProvider should exist');
            assert.strictEqual(rename.prepareProvider, true);
        });

        test('includes diagnostic provider', () => {
            const result = buildInitializeResult(false);
            const diag = result.capabilities.diagnosticProvider as {
                interFileDependencies: boolean;
                workspaceDiagnostics: boolean;
            };
            assert.ok(diag, 'diagnosticProvider should exist');
            assert.strictEqual(diag.interFileDependencies, false);
            assert.strictEqual(diag.workspaceDiagnostics, false);
        });

        test('includes incremental text document sync', () => {
            const result = buildInitializeResult(false);
            // TextDocumentSyncKind.Incremental === 2
            assert.strictEqual(result.capabilities.textDocumentSync, 2);
        });

        test('completion provider has correct trigger characters', () => {
            const result = buildInitializeResult(false);
            const comp = result.capabilities.completionProvider;
            assert.ok(comp, 'completionProvider should exist');
            assert.deepStrictEqual(
                comp!.triggerCharacters,
                ['<', ' ', '"', '=', '/', '#']
            );
        });

        test('document link provider supports resolve', () => {
            const result = buildInitializeResult(false);
            const links = result.capabilities.documentLinkProvider as { resolveProvider: boolean };
            assert.ok(links, 'documentLinkProvider should exist');
            assert.strictEqual(links.resolveProvider, true);
        });

        test('excludes workspace folders when not supported', () => {
            const result = buildInitializeResult(false);
            assert.strictEqual(result.capabilities.workspace, undefined);
        });

        test('includes workspace folders when supported', () => {
            const result = buildInitializeResult(true);
            assert.ok(result.capabilities.workspace, 'workspace should exist');
            assert.ok(
                result.capabilities.workspace!.workspaceFolders,
                'workspaceFolders should exist'
            );
            assert.strictEqual(
                result.capabilities.workspace!.workspaceFolders!.supported,
                true
            );
        });
    });

    // ── isMapFile ───────────────────────────────────────────────

    suite('isMapFile', () => {
        test('returns true for .ditamap files', () => {
            assert.strictEqual(isMapFile('file:///docs/root.ditamap'), true);
        });

        test('returns true for .bookmap files', () => {
            assert.strictEqual(isMapFile('file:///docs/guide.bookmap'), true);
        });

        test('returns false for .dita files', () => {
            assert.strictEqual(isMapFile('file:///docs/topic.dita'), false);
        });

        test('returns false for .xml files', () => {
            assert.strictEqual(isMapFile('file:///docs/config.xml'), false);
        });

        test('returns false for empty string', () => {
            assert.strictEqual(isMapFile(''), false);
        });

        test('returns false for path containing ditamap as substring', () => {
            assert.strictEqual(isMapFile('file:///ditamap-dir/topic.dita'), false);
        });
    });

    // ── classifyWatchedFileChanges ──────────────────────────────

    suite('classifyWatchedFileChanges', () => {
        test('classifies a single .ditamap change', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/root.ditamap', type: FileChangeType.Changed },
                ],
            });
            assert.strictEqual(result.mapChanged, true);
            assert.strictEqual(result.ditaFileChanged, true);
            assert.strictEqual(result.changes.length, 1);
            assert.strictEqual(result.changes[0].isMap, true);
            assert.strictEqual(result.changes[0].isDita, true);
        });

        test('classifies a single .dita change', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/topic.dita', type: FileChangeType.Changed },
                ],
            });
            assert.strictEqual(result.mapChanged, false);
            assert.strictEqual(result.ditaFileChanged, true);
            assert.strictEqual(result.changes.length, 1);
            assert.strictEqual(result.changes[0].isMap, false);
            assert.strictEqual(result.changes[0].isDita, true);
        });

        test('classifies a .bookmap change as map', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/guide.bookmap', type: FileChangeType.Created },
                ],
            });
            assert.strictEqual(result.mapChanged, true);
            assert.strictEqual(result.ditaFileChanged, true);
            assert.strictEqual(result.changes[0].isMap, true);
        });

        test('classifies non-DITA files', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/readme.md', type: FileChangeType.Changed },
                ],
            });
            assert.strictEqual(result.mapChanged, false);
            assert.strictEqual(result.ditaFileChanged, false);
            assert.strictEqual(result.changes[0].isMap, false);
            assert.strictEqual(result.changes[0].isDita, false);
        });

        test('handles mixed changes', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/root.ditamap', type: FileChangeType.Changed },
                    { uri: 'file:///docs/topic.dita', type: FileChangeType.Changed },
                    { uri: 'file:///docs/readme.md', type: FileChangeType.Changed },
                ],
            });
            assert.strictEqual(result.mapChanged, true);
            assert.strictEqual(result.ditaFileChanged, true);
            assert.strictEqual(result.changes.length, 3);
        });

        test('handles empty change list', () => {
            const result = classifyWatchedFileChanges({ changes: [] });
            assert.strictEqual(result.mapChanged, false);
            assert.strictEqual(result.ditaFileChanged, false);
            assert.deepStrictEqual(result.changes, []);
        });

        test('preserves file change type', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/topic.dita', type: FileChangeType.Deleted },
                ],
            });
            assert.strictEqual(result.changes[0].type, FileChangeType.Deleted);
        });

        test('provides fsPath for each change', () => {
            const result = classifyWatchedFileChanges({
                changes: [
                    { uri: 'file:///docs/topic.dita', type: FileChangeType.Changed },
                ],
            });
            assert.strictEqual(result.changes[0].fsPath, '/docs/topic.dita');
            assert.strictEqual(result.changes[0].uri, 'file:///docs/topic.dita');
        });
    });
});
