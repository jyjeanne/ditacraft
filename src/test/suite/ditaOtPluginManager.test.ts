/**
 * DITA-OT Plugin Manager Test Suite
 * Pure tests for plugin list parsing, registry catalogs and install argument handling.
 */

import * as assert from 'assert';
import {
    buildCatalogFromFileNames,
    buildInstallArgs,
    buildRegistryCatalog,
    installPlugin,
    listInstalledPlugins,
    parseInstalledPlugins,
    resolveRegistryBaseUrl,
    DitaCliRunner
} from '../../utils/ditaOtPluginManager';

suite('DITA-OT Plugin Manager Test Suite', () => {

    test('parseInstalledPlugins reads id and id@version lines and ignores noise', () => {
        const stdout = [
            'dita-ot-pdf@4.4.1',
            '',
            'org.example.plugin',
            'Installed plugins:',
            '[ERROR] not a plugin line'
        ].join('\n');
        assert.deepStrictEqual(parseInstalledPlugins(stdout), [
            { id: 'dita-ot-pdf', version: '4.4.1' },
            { id: 'org.example.plugin' }
        ]);
    });

    test('buildInstallArgs pins a version only when one is given', () => {
        assert.deepStrictEqual(buildInstallArgs('dita-ot-pdf'), ['install', 'dita-ot-pdf']);
        assert.deepStrictEqual(buildInstallArgs('dita-ot-pdf', '4.4.1'), ['install', 'dita-ot-pdf@4.4.1']);
    });

    test('buildInstallArgs rejects ids and versions that could inject options', () => {
        assert.throws(() => buildInstallArgs('--evil'));
        assert.throws(() => buildInstallArgs('plugin; rm -rf /'));
        assert.throws(() => buildInstallArgs('plugin', '1.0 --force'));
    });

    test('buildRegistryCatalog merges _all.json style maps, sorts versions newest first and skips invalid ids', () => {
        const payload = {
            'dita-ot-pdf': [
                { name: 'dita-ot-pdf', vers: '4.3.0', description: 'PDF output' },
                { name: 'dita-ot-pdf', vers: '4.10.0', description: 'PDF output' }
            ],
            'bad': [{ name: 'bad id with spaces', vers: '1.0.0' }]
        };
        assert.deepStrictEqual(buildRegistryCatalog(payload), [
            { id: 'dita-ot-pdf', description: 'PDF output', versions: ['4.10.0', '4.3.0'] }
        ]);
    });

    test('buildCatalogFromFileNames keeps plugin json files only', () => {
        const catalog = buildCatalogFromFileNames(['dita-ot-pdf.json', '_all.json', 'README.md', 'org.example.json']);
        assert.deepStrictEqual(catalog.map(p => p.id), ['dita-ot-pdf', 'org.example']);
    });

    test('resolveRegistryBaseUrl falls back to the default for non-http(s) values', () => {
        assert.strictEqual(resolveRegistryBaseUrl('ftp://example.com'), 'https://plugins.dita-ot.org/');
        assert.strictEqual(resolveRegistryBaseUrl('not a url'), 'https://plugins.dita-ot.org/');
        assert.strictEqual(resolveRegistryBaseUrl('https://registry.example.com'), 'https://registry.example.com/');
    });

    test('installPlugin reports success and passes the install arguments to the runner', async () => {
        let receivedArgs: string[] = [];
        const runner: DitaCliRunner = async args => {
            receivedArgs = args;
            return { code: 0, stdout: 'Installed', stderr: '', timedOut: false };
        };
        const result = await installPlugin(runner, 'dita-ot-pdf', '4.4.1');
        assert.deepStrictEqual(receivedArgs, ['install', 'dita-ot-pdf@4.4.1']);
        assert.strictEqual(result.success, true);
    });

    test('installPlugin reports the first error line as the failure reason', async () => {
        const runner: DitaCliRunner = async () => ({
            code: 1,
            stdout: '',
            stderr: '[ERROR] Plugin dita-ot-pdf requires DITA-OT 4.5\nBUILD FAILED',
            timedOut: false
        });
        const result = await installPlugin(runner, 'dita-ot-pdf');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.reason, '[ERROR] Plugin dita-ot-pdf requires DITA-OT 4.5');
    });

    test('listInstalledPlugins throws when the CLI exits with an error', async () => {
        const runner: DitaCliRunner = async () => ({ code: 127, stdout: '', stderr: 'dita: not found', timedOut: false });
        await assert.rejects(() => listInstalledPlugins(runner), /dita: not found/);
    });
});
