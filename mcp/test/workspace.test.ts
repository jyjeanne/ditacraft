import * as assert from 'assert';
import * as path from 'path';
import { resolvePath, validateWithinWorkspace, fileExists } from '../src/workspace';

suite('WorkspaceValidator', () => {

    const ws = process.platform === 'win32'
        ? 'C:\\projects\\dita-docs'
        : '/home/user/dita-docs';

    test('resolves relative path within workspace to file:// URI', () => {
        const result = resolvePath('topics/intro.dita', ws);
        assert.ok(result);
        assert.ok(result!.startsWith('file://'));
        assert.ok(result!.includes('topics/intro.dita'));
    });

    test('resolves file:// URI within workspace', () => {
        const fileUri = process.platform === 'win32'
            ? 'file:///C:/projects/dita-docs/topics/intro.dita'
            : 'file:///home/user/dita-docs/topics/intro.dita';
        const result = resolvePath(fileUri, ws);
        assert.ok(result);
        assert.ok(result!.includes('topics/intro.dita'));
    });

    test('rejects path traversing > 8 levels above workspace', () => {
        const deep = '../'.repeat(10) + 'etc/passwd';
        const result = resolvePath(deep, ws);
        assert.strictEqual(result, null);
    });

    test('rejects absolute path outside workspace', () => {
        const outside = process.platform === 'win32' ? 'C:\\Windows\\System32\\config\\SAM' : '/etc/passwd';
        const result = resolvePath(outside, ws);
        assert.strictEqual(result, null);
    });

    test('rejects http:// URL', () => {
        const result = resolvePath('http://example.com/malware.xml', ws);
        assert.strictEqual(result, null);
    });

    test('rejects https:// URL', () => {
        const result = resolvePath('https://example.com/malware.xml', ws);
        assert.strictEqual(result, null);
    });

    test('rejects UNC path', () => {
        const result = resolvePath('\\\\server\\share\\file.dita', ws);
        assert.strictEqual(result, null);
    });

    test('rejects path with null byte injection', () => {
        const result = resolvePath('topics/\x00secret.dita', ws);
        assert.strictEqual(result, null);
    });

    test('normalizes forward/backward slashes', () => {
        const result = resolvePath('topics\\nested/chapter.dita', ws);
        assert.ok(result);
        // Should not contain backslashes in the file:// URI
        assert.ok(!result!.includes('\\'));
    });

    test('rejects empty string input', () => {
        const result = resolvePath('', ws);
        assert.strictEqual(result, null);
    });

    suite('validateWithinWorkspace', () => {
        test('accepts file within workspace', () => {
            const fp = path.join(ws, 'topics', 'intro.dita');
            assert.ok(validateWithinWorkspace(fp, ws));
        });

        test('rejects file outside workspace', () => {
            const fp = process.platform === 'win32' ? 'C:\\Windows\\file.dita' : '/etc/file.dita';
            assert.strictEqual(validateWithinWorkspace(fp, ws), false);
        });

        test('rejects deep traversal', () => {
            const fp = path.resolve(ws, ...Array(10).fill('..'), 'etc', 'passwd');
            assert.strictEqual(validateWithinWorkspace(fp, ws), false);
        });
    });
});
