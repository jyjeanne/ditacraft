/**
 * Unit tests for the MCP server's settings (mcp/src/mcpSettings.ts).
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { defaultMcpSettings, loadMcpSettings, resolveSettingPath, stripJsonComments } from '../src/mcpSettings';

suite('mcpSettings', () => {

    let workspace: string;

    setup(() => {
        workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-mcp-settings-'));
    });

    teardown(() => {
        fs.rmSync(workspace, { recursive: true, force: true });
    });

    function writeSettings(content: string, relative = '.vscode/settings.json'): string {
        const file = path.join(workspace, relative);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        return file;
    }

    suite('stripJsonComments', () => {

        test('removes line and block comments', () => {
            const text = '{\n  // line\n  "a": 1, /* block */ "b": 2\n}';
            assert.deepStrictEqual(JSON.parse(stripJsonComments(text)), { a: 1, b: 2 });
        });

        test('removes trailing commas in objects and arrays', () => {
            const text = '{ "a": [1, 2, ], "b": { "c": 3, }, }';
            assert.deepStrictEqual(JSON.parse(stripJsonComments(text)), { a: [1, 2], b: { c: 3 } });
        });

        test('leaves comment and comma characters inside strings alone', () => {
            const text = '{ "url": "https://example.com/a,}", "glob": "/* not a comment */", "q": "say \\"hi\\" // ok" }';
            assert.deepStrictEqual(JSON.parse(stripJsonComments(text)), {
                url: 'https://example.com/a,}',
                glob: '/* not a comment */',
                q: 'say "hi" // ok',
            });
        });
    });

    suite('resolveSettingPath', () => {

        test('resolves relative paths against the workspace', () => {
            assert.strictEqual(resolveSettingPath('rules/a.json', workspace), path.join(workspace, 'rules', 'a.json'));
        });

        test('expands ${workspaceFolder}', () => {
            assert.strictEqual(resolveSettingPath('${workspaceFolder}/rules/a.json', workspace), path.join(workspace, 'rules', 'a.json'));
        });

        test('keeps absolute paths', () => {
            const absolute = path.join(os.tmpdir(), 'catalog.xml');
            assert.strictEqual(resolveSettingPath(absolute, workspace), absolute);
        });
    });

    suite('loadMcpSettings', () => {

        test('uses the defaults when the workspace has no settings file', () => {
            const loaded = loadMcpSettings(workspace, {});
            assert.deepStrictEqual(loaded.settings, defaultMcpSettings());
            assert.strictEqual(loaded.settingsFile, undefined);
            assert.deepStrictEqual(loaded.warnings, []);
        });

        test('applies the ditacraft.* settings of .vscode/settings.json', () => {
            const file = writeSettings(JSON.stringify({
                'ditacraft.ditaRulesEnabled': false,
                'ditacraft.ditaRulesCategories': ['mandatory'],
                'ditacraft.validationSeverityOverrides': { 'DITA-SCH-045': 'off' },
                'ditacraft.largeFileThresholdKB': 100,
                'editor.tabSize': 2,
            }));
            const loaded = loadMcpSettings(workspace, {});
            assert.strictEqual(loaded.settingsFile, file);
            assert.strictEqual(loaded.settings.ditaRulesEnabled, false);
            assert.deepStrictEqual(loaded.settings.ditaRulesCategories, ['mandatory']);
            assert.deepStrictEqual(loaded.settings.validationSeverityOverrides, { 'DITA-SCH-045': 'off' });
            assert.strictEqual(loaded.settings.largeFileThresholdKB, 100);
        });

        test('ignores values of the wrong type, with a warning', () => {
            writeSettings('{ "ditacraft.ditaRulesEnabled": "no", "ditacraft.ditaRulesCategories": "mandatory" }');
            const loaded = loadMcpSettings(workspace, {});
            assert.strictEqual(loaded.settings.ditaRulesEnabled, true);
            assert.deepStrictEqual(loaded.settings.ditaRulesCategories, defaultMcpSettings().ditaRulesCategories);
            assert.strictEqual(loaded.warnings.length, 2);
            assert.ok(loaded.warnings[0].includes('ditacraft.ditaRulesEnabled'));
        });

        test('ignores editor-only and unknown settings', () => {
            writeSettings('{ "ditacraft.autoValidate": true, "ditacraft.logLevel": "debug", "ditacraft.previewTheme": "dark" }');
            const loaded = loadMcpSettings(workspace, {});
            assert.deepStrictEqual(loaded.settings, defaultMcpSettings());
            assert.deepStrictEqual(loaded.warnings, []);
        });

        test('reports a malformed settings file and keeps the defaults', () => {
            writeSettings('{ "ditacraft.ditaRulesEnabled": false');
            const loaded = loadMcpSettings(workspace, {});
            assert.strictEqual(loaded.settings.ditaRulesEnabled, true);
            assert.strictEqual(loaded.settingsFile, undefined);
            assert.strictEqual(loaded.warnings.length, 1);
        });

        test('resolves path settings against the workspace', () => {
            writeSettings('{ "ditacraft.customRulesFile": "rules/custom.json", "ditacraft.xmlCatalogPath": "${workspaceFolder}/catalog.xml" }');
            fs.mkdirSync(path.join(workspace, 'rules'));
            fs.writeFileSync(path.join(workspace, 'rules', 'custom.json'), '{ "rules": [] }');
            fs.writeFileSync(path.join(workspace, 'catalog.xml'), '<catalog/>');
            const loaded = loadMcpSettings(workspace, {});
            assert.strictEqual(loaded.settings.customRulesFile, path.join(workspace, 'rules', 'custom.json'));
            assert.strictEqual(loaded.settings.xmlCatalogPath, path.join(workspace, 'catalog.xml'));
            assert.deepStrictEqual(loaded.warnings, []);
        });

        test('environment variables override the settings file', () => {
            writeSettings('{ "ditacraft.customRulesFile": "a.json", "ditacraft.xmlCatalogPath": "a.xml" }');
            const loaded = loadMcpSettings(workspace, {
                DITACRAFT_CUSTOM_RULES_FILE: 'b.json',
                DITACRAFT_XML_CATALOG: 'b.xml',
            });
            assert.strictEqual(loaded.settings.customRulesFile, path.join(workspace, 'b.json'));
            assert.strictEqual(loaded.settings.xmlCatalogPath, path.join(workspace, 'b.xml'));
        });

        test('warns about a catalog or rules file that does not exist', () => {
            const loaded = loadMcpSettings(workspace, { DITACRAFT_XML_CATALOG: 'missing.xml', DITACRAFT_CUSTOM_RULES_FILE: 'missing.json' });
            assert.strictEqual(loaded.warnings.length, 2);
            assert.ok(loaded.warnings.some((w) => w.includes('missing.xml')));
            assert.ok(loaded.warnings.some((w) => w.includes('missing.json')));
        });

        test('DITACRAFT_SETTINGS_FILE replaces .vscode/settings.json', () => {
            writeSettings('{ "ditacraft.ditaRulesEnabled": false }');
            const other = writeSettings('{ "ditacraft.crossRefValidationEnabled": false }', 'ci/settings.json');
            const loaded = loadMcpSettings(workspace, { DITACRAFT_SETTINGS_FILE: 'ci/settings.json' });
            assert.strictEqual(loaded.settingsFile, other);
            assert.strictEqual(loaded.settings.ditaRulesEnabled, true, '.vscode/settings.json must not be read');
            assert.strictEqual(loaded.settings.crossRefValidationEnabled, false);
        });

        test('warns when DITACRAFT_SETTINGS_FILE does not exist', () => {
            const loaded = loadMcpSettings(workspace, { DITACRAFT_SETTINGS_FILE: 'nowhere.json' });
            assert.strictEqual(loaded.settingsFile, undefined);
            assert.strictEqual(loaded.warnings.length, 1);
        });
    });
});
