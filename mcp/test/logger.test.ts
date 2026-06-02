import * as assert from 'assert';
import { log, setLevel } from '../src/logger';

suite('Logger', () => {

    let captured: string[] = [];
    let originalWrite: typeof process.stderr.write;
    const decoder = new TextDecoder();

    setup(() => {
        captured = [];
        originalWrite = process.stderr.write;
        process.stderr.write = ((chunk: string | Buffer) => {
            captured.push(typeof chunk === 'string' ? chunk : decoder.decode(chunk));
            return true;
        }) as typeof process.stderr.write;
        setLevel('debug');
    });

    teardown(() => {
        process.stderr.write = originalWrite;
    });

    test('writes to stderr when level >= current', () => {
        log('warn', 'test message');
        assert.ok(captured.length > 0);
        assert.ok(captured.some(c => c.includes('test message')));
        assert.ok(captured.some(c => c.includes('[WARN]')));
    });

    test('suppresses debug when level is warn', () => {
        setLevel('warn');
        captured = [];
        log('debug', 'should not appear');
        assert.strictEqual(captured.length, 0);
        log('error', 'should appear');
        assert.ok(captured.length > 0);
    });

    test('setLevel changes filtering', () => {
        setLevel('error');
        captured = [];
        log('warn', 'should not appear at error level');
        assert.strictEqual(captured.length, 0);
        log('error', 'should appear at error level');
        assert.ok(captured.length > 0);
    });

    test('log format includes timestamp and level', () => {
        setLevel('info');
        captured = [];
        log('info', 'formatted message');
        assert.ok(captured.length > 0);
        const msg = captured[0];
        assert.ok(msg.includes('[ditacraft-mcp]'));
        assert.ok(msg.includes('[INFO]'));
        assert.ok(msg.includes('formatted message'));
        // Should have ISO timestamp
        assert.ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(msg));
    });
});
