/**
 * DITA-OT Plugin Manager Test Suite
 * Pure tests for plugin list parsing, registry catalogs, install argument handling and the
 * uninstall rules (descriptors, dependencies, protection, output).
 */

import * as assert from 'assert';
import * as path from 'path';
import {
    buildCatalogFromFileNames,
    buildInstallArgs,
    buildRegistryCatalog,
    buildUninstallArgs,
    classifyForUninstall,
    describeUninstallBlock,
    findDependents,
    installPlugin,
    isProtectedPlugin,
    listInstalledPlugins,
    parseInstalledPlugins,
    parsePluginDescriptor,
    parsePluginDirs,
    parseUninstallOutput,
    resolveRegistryBaseUrl,
    DitaCliResult,
    DitaCliRunner,
    PluginDescriptor
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

    test('parseInstalledPlugins rejects header lines that look like id and version', () => {
        const stdout = ['Plugin Version', 'Installed plugins', 'Name Version', 'org.example 1.0.0'].join('\n');
        assert.deepStrictEqual(parseInstalledPlugins(stdout), [{ id: 'org.example', version: '1.0.0' }]);
    });

    test('parseInstalledPlugins prefers duplicate entries that include a version', () => {
        const stdout = ['org.example.plugin', 'org.example.plugin 1.2.3'].join('\n');
        assert.deepStrictEqual(parseInstalledPlugins(stdout), [{ id: 'org.example.plugin', version: '1.2.3' }]);
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

    test('resolveRegistryBaseUrl falls back to the default for non-https values', () => {
        assert.strictEqual(resolveRegistryBaseUrl('ftp://example.com'), 'https://plugins.dita-ot.org/');
        assert.strictEqual(resolveRegistryBaseUrl('http://registry.example.com'), 'https://plugins.dita-ot.org/');
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

    suite('Uninstall rules', () => {
        const ditaOt = path.join(path.sep, 'opt', 'dita-ot');
        const inPlugins = (id: string): string => path.join(ditaOt, 'plugins', id);

        function descriptor(id: string, declares: Partial<PluginDescriptor> = {}): PluginDescriptor {
            return { id, folder: inPlugins(id), requires: [], features: [], extensionPoints: [], ...declares };
        }

        // As in DITA-OT 4.3.5: org.dita.index uses an extension point of org.dita.pdf2 without requiring it.
        const pdf2 = descriptor('org.dita.pdf2', { extensionPoints: ['depend.org.dita.pdf2.index', 'dita.xsl.xslfo'] });
        const index = descriptor('org.dita.index', { features: ['dita.conductor.lib.import', 'depend.org.dita.pdf2.index'] });
        const fop = descriptor('org.dita.pdf2.fop', { requires: [{ alternatives: ['org.dita.pdf2'], optional: false }] });

        test('parsePluginDescriptor reads the id, version, requirements, features and extension points', () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- A plugin -->
<plugin id="com.example.pdf" version="2.1.0">
  <require plugin="org.dita.pdf2"/>
  <require plugin="com.example.fonts | com.example.fonts-free"/>
  <require plugin="com.example.extras" importance="optional"/>
  <feature extension="dita.conductor.lib.import" file="lib/pdf.jar"/>
  <feature extension="dita.xsl.xslfo" file="xsl/custom.xsl"/>
  <feature extension="dita.xsl.xslfo" file="xsl/more.xsl"/>
  <extension-point id="com.example.pdf.xsl" name="Custom PDF XSLT"/>
  <transtype name="example-pdf" extends="pdf2"/>
</plugin>`;
            assert.deepStrictEqual(parsePluginDescriptor(xml, inPlugins('com.example.pdf')), {
                id: 'com.example.pdf',
                version: '2.1.0',
                folder: inPlugins('com.example.pdf'),
                requires: [
                    { alternatives: ['org.dita.pdf2'], optional: false },
                    { alternatives: ['com.example.fonts', 'com.example.fonts-free'], optional: false },
                    { alternatives: ['com.example.extras'], optional: true }
                ],
                features: ['dita.conductor.lib.import', 'dita.xsl.xslfo'],
                extensionPoints: ['com.example.pdf.xsl']
            });
        });

        test('parsePluginDescriptor rejects files that are not plugin descriptors with a valid id', () => {
            assert.strictEqual(parsePluginDescriptor('<project name="build"/>', 'x'), undefined);
            assert.strictEqual(parsePluginDescriptor('<plugin version="1.0"/>', 'x'), undefined);
            assert.strictEqual(parsePluginDescriptor('<plugin id="../evil"/>', 'x'), undefined);
            assert.strictEqual(parsePluginDescriptor('not xml at all', 'x'), undefined);
        });

        test('parsePluginDirs reads plugindirs as DITA-OT writes it, with its default', () => {
            assert.deepStrictEqual(parsePluginDirs('# DITA-OT configuration\nplugindirs = plugins;demo\nplugin.ignores =\n'), ['plugins', 'demo']);
            assert.deepStrictEqual(parsePluginDirs('registry = https://plugins.dita-ot.org/\n'), ['plugins', 'demo']);
            assert.deepStrictEqual(parsePluginDirs(''), ['plugins', 'demo']);
        });

        test('parsePluginDirs unescapes Java properties and keeps the last value', () => {
            assert.deepStrictEqual(parsePluginDirs('plugindirs=plugins;C\\:\\\\dev\\\\plugins\r\n'), ['plugins', 'C:\\dev\\plugins']);
            assert.deepStrictEqual(parsePluginDirs('plugindirs = old\n! comment\nplugindirs : plugins; \\\n    extra ;\n'), ['plugins', 'extra']);
        });

        test('isProtectedPlugin protects the plugins of DITA-OT only', () => {
            assert.strictEqual(isProtectedPlugin('org.dita.base'), true);
            assert.strictEqual(isProtectedPlugin('org.dita.pdf2.fop'), true);
            assert.strictEqual(isProtectedPlugin('org.oasis-open.dita.v1_3'), true);
            assert.strictEqual(isProtectedPlugin('com.elovirta.pdf'), false);
            assert.strictEqual(isProtectedPlugin('org.lwdita'), false);
            assert.strictEqual(isProtectedPlugin('org.ditax.tools'), false);
        });

        test('findDependents finds the plugins that require the target or use its extension points', () => {
            assert.deepStrictEqual(findDependents('org.dita.pdf2', [pdf2, index, fop]), ['org.dita.index', 'org.dita.pdf2.fop']);
            assert.deepStrictEqual(findDependents('org.dita.index', [pdf2, index, fop]), []);
        });

        test('findDependents ignores optional requirements and requirements met by another installed plugin', () => {
            const either = descriptor('com.example.uses-either', { requires: [{ alternatives: ['com.example.a', 'com.example.b'], optional: false }] });
            const optional = descriptor('com.example.optional', { requires: [{ alternatives: ['com.example.a'], optional: true }] });
            const a = descriptor('com.example.a');
            const b = descriptor('com.example.b');
            assert.deepStrictEqual(findDependents('com.example.a', [either, optional, a, b]), []);
            assert.deepStrictEqual(findDependents('com.example.a', [either, optional, a]), ['com.example.uses-either']);
        });

        test('findDependents does not count a plugin that uses its own extension point', () => {
            const self = descriptor('com.example.self', { extensionPoints: ['com.example.self.xsl'], features: ['com.example.self.xsl'] });
            assert.deepStrictEqual(findDependents('com.example.self', [self]), []);
        });

        test('classifyForUninstall blocks protected, misplaced, unknown and required plugins', () => {
            const test1 = descriptor('com.example.test');
            const child = descriptor('com.example.child', { requires: [{ alternatives: ['com.example.test'], optional: false }] });
            const dev = descriptor('com.example.dev', { folder: path.join(path.sep, 'work', 'plugins', 'com.example.dev') });
            const renamed = descriptor('com.example.renamed', { folder: inPlugins('my-folder') });
            const installed = ['org.dita.base', 'com.example.test', 'com.example.child', 'com.example.dev', 'com.example.renamed', 'com.example.ghost']
                .map(id => ({ id, version: '1.0.0' }));

            const candidates = classifyForUninstall(installed, [test1, child, dev, renamed], ditaOt);
            const reasons = Object.fromEntries(candidates.map(c => [c.id, c.block ? describeUninstallBlock(c.block) : 'removable']));
            assert.deepStrictEqual(reasons, {
                'org.dita.base': 'Part of DITA-OT',
                'com.example.test': 'Required by com.example.child',
                'com.example.child': 'removable',
                'com.example.dev': `In ${dev.folder}: not removed by dita uninstall`,
                'com.example.renamed': `In ${renamed.folder}: not removed by dita uninstall`,
                'com.example.ghost': 'Not found in the plugins folder of DITA-OT'
            });
            assert.strictEqual(candidates[2].version, '1.0.0');
        });

        test('buildUninstallArgs passes one valid plugin id', () => {
            assert.deepStrictEqual(buildUninstallArgs('com.example.test'), ['uninstall', 'com.example.test']);
            assert.throws(() => buildUninstallArgs('../org.dita.html5'), /Invalid plugin id/);
            assert.throws(() => buildUninstallArgs('--force'), /Invalid plugin id/);
            assert.throws(() => buildUninstallArgs('a b'), /Invalid plugin id/);
        });

        test('parseUninstallOutput reads the outputs of DITA-OT 4.3.5', () => {
            const result = (code: number | null, stdout: string, stderr = '', timedOut = false): DitaCliResult => ({ code, stdout, stderr, timedOut });

            assert.deepStrictEqual(parseUninstallOutput(result(0, 'Removed com.example.test\r\n'), 'com.example.test'),
                { success: true, notFound: false, highlights: [] });

            const notFound = parseUninstallOutput(result(1, '', 'Error: Plug-in com.example.missing not found\r\n'), 'com.example.missing');
            assert.strictEqual(notFound.success, false);
            assert.strictEqual(notFound.notFound, true);
            assert.strictEqual(notFound.reason, 'Plug-in com.example.missing not found');

            const integration = parseUninstallOutput(result(1, '',
                "Error: Integration failed: java.lang.RuntimeException: [DOTJ020W] The 'com.example.child' plug-in cannot be loaded because it requires at least one plug-in in 'PluginRequirement[plugins=[com.example.test], required=true]'. Make sure all prerequisite plug-ins are properly installed.\r\n"),
            'com.example.test');
            assert.strictEqual(integration.success, false);
            assert.strictEqual(integration.notFound, false);
            assert.match(integration.reason ?? '', /^Integration failed: \[DOTJ020W\] The 'com.example.child' plug-in cannot be loaded/);

            assert.strictEqual(parseUninstallOutput(result(0, 'Removed com.example.other\r\n'), 'com.example.test').success, false);
            assert.strictEqual(parseUninstallOutput(result(0, ''), 'com.example.test').reason, 'DITA-OT did not report the removal');
            assert.strictEqual(parseUninstallOutput(result(null, '', '', true), 'com.example.test').reason, 'timed out');
        });
    });
});
