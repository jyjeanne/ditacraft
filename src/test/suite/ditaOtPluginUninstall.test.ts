/**
 * DITA-OT Plugin Uninstall Test Suite
 * Plugin descriptors read from a DITA-OT folder, and uninstalls with their backup and
 * rollback, on temporary folders, with a fake `dita` that behaves as DITA-OT 4.3.5 does.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    readPluginDescriptors,
    uninstallPlugin,
    DitaCliResult,
    DitaCliRunner
} from '../../utils/ditaOtPluginManager';

suite('DITA-OT Plugin Uninstall Test Suite', () => {
    let root: string;
    let ditaOt: string;
    let backupRoot: string;

    function writePlugin(folder: string, xml: string, extraFiles: Record<string, string> = {}): void {
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, 'plugin.xml'), xml);
        for (const [file, content] of Object.entries(extraFiles)) {
            fs.mkdirSync(path.dirname(path.join(folder, file)), { recursive: true });
            fs.writeFileSync(path.join(folder, file), content);
        }
    }

    const pluginFolder = (id: string): string => path.join(ditaOt, 'plugins', id);
    const ok = (stdout: string): DitaCliResult => ({ code: 0, stdout, stderr: '', timedOut: false });
    const failed = (stderr: string): DitaCliResult => ({ code: 1, stdout: '', stderr, timedOut: false });
    const integrationError = "Error: Integration failed: java.lang.RuntimeException: [DOTJ020W] The 'com.example.child' plug-in cannot be loaded because it requires at least one plug-in in 'PluginRequirement[plugins=[com.example.test], required=true]'.\r\n";

    /** A fake `dita` that records its calls; `uninstall` deletes the plugin folder first, as DITA-OT does. */
    function fakeDita(onUninstall: () => DitaCliResult, onInstall: () => DitaCliResult = () => ok('')): { run: DitaCliRunner; calls: string[][] } {
        const calls: string[][] = [];
        const run: DitaCliRunner = async args => {
            calls.push(args);
            if (args[0] === 'uninstall') {
                fs.rmSync(pluginFolder(args[1]), { recursive: true, force: true });
                return onUninstall();
            }
            return onInstall();
        };
        return { run, calls };
    }

    setup(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-uninstall-test-'));
        ditaOt = path.join(root, 'dita-ot-4.3.5');
        backupRoot = path.join(root, 'backups');
        fs.mkdirSync(backupRoot, { recursive: true });
        writePlugin(pluginFolder('com.example.test'), '<plugin id="com.example.test" version="1.0.0"><require plugin="org.dita.html5"/></plugin>',
            { 'lib/test.jar': 'jar content', 'xsl/test.xsl': '<xsl:stylesheet/>' });
        writePlugin(pluginFolder('com.example.child'), '<plugin id="com.example.child" version="1.0.0"><require plugin="com.example.test"/></plugin>');
    });

    teardown(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    test('readPluginDescriptors reads every plugin folder of plugindirs, relative or absolute', () => {
        const extra = path.join(root, 'work plugins');
        writePlugin(path.join(extra, 'com.example.dev'), '<plugin id="com.example.dev"/>');
        fs.mkdirSync(path.join(ditaOt, 'plugins', 'notes'), { recursive: true });
        fs.mkdirSync(path.join(ditaOt, 'config'), { recursive: true });
        const escaped = extra.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        fs.writeFileSync(path.join(ditaOt, 'config', 'configuration.properties'), `plugindirs = plugins;demo;${escaped}\r\n`);

        const found = readPluginDescriptors(ditaOt).map(d => [d.id, d.folder]).sort();
        assert.deepStrictEqual(found, [
            ['com.example.child', pluginFolder('com.example.child')],
            ['com.example.dev', path.join(extra, 'com.example.dev')],
            ['com.example.test', pluginFolder('com.example.test')]
        ]);
    });

    test('readPluginDescriptors falls back to plugins;demo without a configuration file', () => {
        writePlugin(path.join(ditaOt, 'demo', 'com.example.demo'), '<plugin id="com.example.demo"/>');
        assert.deepStrictEqual(readPluginDescriptors(ditaOt).map(d => d.id).sort(), ['com.example.child', 'com.example.demo', 'com.example.test']);
    });

    test('uninstallPlugin removes the plugin and discards the backup', async () => {
        const dita = fakeDita(() => ok('Removed com.example.child\r\n'));
        const result = await uninstallPlugin(dita.run, 'com.example.child', { ditaOtPath: ditaOt, backupRoot });

        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(dita.calls, [['uninstall', 'com.example.child']]);
        assert.strictEqual(fs.existsSync(pluginFolder('com.example.child')), false);
        assert.deepStrictEqual(fs.readdirSync(backupRoot), [], 'the backup is removed');
    });

    test('uninstallPlugin puts the plugin back and integrates DITA-OT again when the integration fails', async () => {
        const dita = fakeDita(() => failed(integrationError), () => ok('Added com.example.test\r\n'));
        const result = await uninstallPlugin(dita.run, 'com.example.test', { ditaOtPath: ditaOt, backupRoot });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.restored, true);
        assert.match(result.reason ?? '', /^Integration failed: \[DOTJ020W\] The 'com.example.child' plug-in cannot be loaded/);
        assert.deepStrictEqual(dita.calls, [['uninstall', 'com.example.test'], ['install']]);
        assert.strictEqual(fs.readFileSync(path.join(pluginFolder('com.example.test'), 'lib', 'test.jar'), 'utf8'), 'jar content');
        assert.strictEqual(fs.readFileSync(path.join(pluginFolder('com.example.test'), 'xsl', 'test.xsl'), 'utf8'), '<xsl:stylesheet/>');
        assert.deepStrictEqual(fs.readdirSync(backupRoot), []);
    });

    test('uninstallPlugin keeps the backup and says why when DITA-OT cannot be integrated again', async () => {
        const dita = fakeDita(() => failed(integrationError), () => failed('Error: Integration failed: disk full\r\n'));
        const result = await uninstallPlugin(dita.run, 'com.example.test', { ditaOtPath: ditaOt, backupRoot });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.restored, false);
        assert.strictEqual(result.rollbackError, 'integrating DITA-OT again failed: Error: Integration failed: disk full');
        assert.ok(result.backupPath && fs.existsSync(path.join(result.backupPath, 'com.example.test', 'lib', 'test.jar')), 'the copy is kept');
        assert.ok(fs.existsSync(path.join(pluginFolder('com.example.test'), 'plugin.xml')), 'the folder is back');
    });

    test('uninstallPlugin changes nothing when DITA-OT does not find the plugin', async () => {
        const calls: string[][] = [];
        const run: DitaCliRunner = async args => {
            calls.push(args);
            return failed('Error: Plug-in com.example.test not found\r\n');
        };
        const result = await uninstallPlugin(run, 'com.example.test', { ditaOtPath: ditaOt, backupRoot });

        assert.strictEqual(result.notFound, true);
        assert.strictEqual(result.restored, undefined);
        assert.deepStrictEqual(calls, [['uninstall', 'com.example.test']]);
        assert.deepStrictEqual(fs.readdirSync(backupRoot), []);
    });

    test('uninstallPlugin rolls back when the runner itself fails', async () => {
        const calls: string[][] = [];
        const run: DitaCliRunner = async args => {
            calls.push(args);
            if (args[0] === 'uninstall') {
                throw new Error('spawn cmd.exe ENOENT');
            }
            return ok('');
        };
        const result = await uninstallPlugin(run, 'com.example.test', { ditaOtPath: ditaOt, backupRoot });

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.reason, 'spawn cmd.exe ENOENT');
        assert.strictEqual(result.restored, true);
        assert.deepStrictEqual(calls, [['uninstall', 'com.example.test'], ['install']]);
        assert.ok(fs.existsSync(path.join(pluginFolder('com.example.test'), 'lib', 'test.jar')));
    });

    test('uninstallPlugin runs nothing when the plugin folder cannot be backed up', async () => {
        const dita = fakeDita(() => ok('Removed com.example.ghost\r\n'));
        await assert.rejects(
            () => uninstallPlugin(dita.run, 'com.example.ghost', { ditaOtPath: ditaOt, backupRoot }),
            /Plugin folder not found/
        );
        assert.deepStrictEqual(dita.calls, []);
    });

    test('uninstallPlugin refuses an invalid plugin id before touching anything', async () => {
        const dita = fakeDita(() => ok(''));
        await assert.rejects(() => uninstallPlugin(dita.run, '../plugins', { ditaOtPath: ditaOt, backupRoot }), /Invalid plugin id/);
        assert.deepStrictEqual(dita.calls, []);
        assert.ok(fs.existsSync(pluginFolder('com.example.test')));
    });
});
