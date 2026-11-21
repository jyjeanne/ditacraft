/**
 * DITA-OT Installer Test Suite
 * Pure tests for version parsing, archive path safety and installation layout detection.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    buildArchiveUrl,
    compareVersionStrings,
    extractZipSafely,
    findDitaOtRoot,
    installDitaOt,
    isValidDitaOtVersion,
    parseReleaseVersions,
    resolveEntryPath
} from '../../utils/ditaOtInstaller';

suite('DITA-OT Installer Test Suite', () => {

    test('compareVersionStrings compares numerically, not lexically', () => {
        assert.ok(compareVersionStrings('4.10.0', '4.9.0') > 0);
        assert.strictEqual(compareVersionStrings('4.4.2', '4.4.2'), 0);
    });

    test('isValidDitaOtVersion rejects values that could alter a command or URL', () => {
        assert.ok(isValidDitaOtVersion('4.4.2'));
        assert.ok(!isValidDitaOtVersion('4.4.2; rm -rf /'));
        assert.ok(!isValidDitaOtVersion('../4.4.2'));
    });

    test('parseReleaseVersions drops drafts, prereleases and non-version tags and sorts newest first', () => {
        const releases = [
            { tag_name: '4.3.0' },
            { tag_name: '4.10.0' },
            { tag_name: '4.11.0-beta', prerelease: true },
            { tag_name: '4.12.0', draft: true },
            { tag_name: 'nightly' },
            { tag_name: '4.4.2' }
        ];
        assert.deepStrictEqual(parseReleaseVersions(releases), ['4.10.0', '4.4.2', '4.3.0']);
        assert.deepStrictEqual(parseReleaseVersions({ not: 'an array' }), []);
    });

    test('buildArchiveUrl refuses invalid versions', () => {
        assert.strictEqual(
            buildArchiveUrl('4.4.2'),
            'https://github.com/dita-ot/dita-ot/releases/download/4.4.2/dita-ot-4.4.2.zip'
        );
        assert.throws(() => buildArchiveUrl('4.4.2/../../evil'));
    });

    test('resolveEntryPath rejects traversal, absolute and drive-letter entries', () => {
        const root = path.resolve('/tmp/ditaot-target');
        assert.throws(() => resolveEntryPath(root, '../evil.txt'));
        assert.throws(() => resolveEntryPath(root, 'a/../../evil.txt'));
        assert.throws(() => resolveEntryPath(root, '/etc/passwd'));
        assert.throws(() => resolveEntryPath(root, 'C:\\Windows\\evil.dll'));
        assert.throws(() => resolveEntryPath(root, 'bad\0name'));
    });

    test('resolveEntryPath keeps normal entries inside the target', () => {
        const root = path.resolve('/tmp/ditaot-target');
        const resolved = resolveEntryPath(root, 'dita-ot-4.4.2/bin/dita');
        assert.strictEqual(resolved, path.join(root, 'dita-ot-4.4.2', 'bin', 'dita'));
    });

    suite('findDitaOtRoot', () => {
        let tmp: string;

        setup(() => {
            tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditaot-root-'));
        });

        teardown(() => {
            fs.rmSync(tmp, { recursive: true, force: true });
        });

        test('finds the DITA-OT root inside a wrapping release folder', () => {
            const bin = path.join(tmp, 'dita-ot-4.4.2', 'bin');
            fs.mkdirSync(bin, { recursive: true });
            fs.writeFileSync(path.join(bin, 'dita'), '#!/bin/sh\n');
            assert.strictEqual(findDitaOtRoot(tmp), path.join(tmp, 'dita-ot-4.4.2'));
        });

        test('returns undefined when no bin/dita exists', () => {
            fs.mkdirSync(path.join(tmp, 'other'), { recursive: true });
            assert.strictEqual(findDitaOtRoot(tmp), undefined);
        });
    });

    suite('installDitaOt guards and extraction failures', () => {
        let tmp: string;

        setup(() => {
            tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditaot-install-'));
        });

        teardown(() => {
            fs.rmSync(tmp, { recursive: true, force: true });
        });

        test('extractZipSafely rejects a file that is not a zip archive', async () => {
            const notZip = path.join(tmp, 'broken.zip');
            fs.writeFileSync(notZip, 'not a zip');
            await assert.rejects(extractZipSafely(notZip, path.join(tmp, 'out')));
        });

        test('installDitaOt rejects an invalid version before any download', async () => {
            await assert.rejects(
                installDitaOt({ version: '4.4.2; rm -rf /', targetDir: tmp, downloadTimeoutMs: 1000, verify: async () => '4.4.2' }),
                /Invalid DITA-OT version/
            );
        });

        test('installDitaOt refuses to overwrite an existing install folder', async () => {
            fs.mkdirSync(path.join(tmp, 'dita-ot-4.4.2'));
            await assert.rejects(
                installDitaOt({ version: '4.4.2', targetDir: tmp, downloadTimeoutMs: 1000, verify: async () => '4.4.2' }),
                /already exists/
            );
        });
    });
});
