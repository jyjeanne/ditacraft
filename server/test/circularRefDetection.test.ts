import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { detectCircularReferences, CYCLE_CODES } from '../src/features/circularRefDetection';

suite('detectCircularReferences', () => {
    test('no references returns empty diagnostics', async () => {
        const text = '<map><title>Simple map</title></map>';
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const testUri = URI.file(path.join(tmpDir, 'root.ditamap')).toString();

        try {
            const diags = await detectCircularReferences(text, testUri);
            assert.strictEqual(diags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('no cycle when A references B and B has no back-reference', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><title>B</title></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            assert.strictEqual(diags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('direct cycle A→B→A produces CIRCULAR_REF diagnostic', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><topicref href="A.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
            assert.ok(cycleDiags[0].message.length > 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('self-reference via href produces CIRCULAR_REF diagnostic', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'self.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="self.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('external URLs are ignored', async () => {
        const text = '<map><topicref href="https://example.com"/></map>';
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const testUri = URI.file(path.join(tmpDir, 'root.ditamap')).toString();

        try {
            const diags = await detectCircularReferences(text, testUri);
            assert.strictEqual(diags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('references inside comments are ignored', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');

        // B references A, but A's reference to B is commented out
        fs.writeFileSync(fileA, '<map><!--<topicref href="B.ditamap"/>--></map>');
        fs.writeFileSync(fileB, '<map><topicref href="A.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            assert.strictEqual(diags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('missing file reference does not crash and produces no diagnostics', async () => {
        const text = '<map><topicref href="nonexistent.ditamap"/></map>';
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const testUri = URI.file(path.join(tmpDir, 'root.ditamap')).toString();

        try {
            const diags = await detectCircularReferences(text, testUri);
            assert.strictEqual(diags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('3-file cycle A→B→C→A is detected', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');
        const fileC = path.join(tmpDir, 'C.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><topicref href="C.ditamap"/></map>');
        fs.writeFileSync(fileC, '<map><topicref href="A.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
            // Cycle path should mention all 3 files (case-insensitive for Windows)
            const msg = cycleDiags[0].message.toLowerCase();
            assert.ok(msg.includes('a.ditamap'));
            assert.ok(msg.includes('b.ditamap'));
            assert.ok(msg.includes('c.ditamap'));
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cycle not involving root file: A→B→C→B is detected', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');
        const fileC = path.join(tmpDir, 'C.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><topicref href="C.ditamap"/></map>');
        fs.writeFileSync(fileC, '<map><topicref href="B.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
            // Cycle is B→C→B, should mention both (case-insensitive for Windows)
            const msg = cycleDiags[0].message.toLowerCase();
            assert.ok(msg.includes('b.ditamap'));
            assert.ok(msg.includes('c.ditamap'));
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('path-dependent cycle: A→B→D (no cycle) and A→C→D→E→C (cycle) both explored', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');
        const fileC = path.join(tmpDir, 'C.ditamap');
        const fileD = path.join(tmpDir, 'D.ditamap');
        const fileE = path.join(tmpDir, 'E.ditamap');

        // A refs B and C; B refs D; D refs E; E refs C; C refs D
        // Cycle: C→D→E→C — but D appears cycle-free when explored from B's path
        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/><topicref href="C.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><topicref href="D.ditamap"/></map>');
        fs.writeFileSync(fileC, '<map><topicref href="D.ditamap"/></map>');
        fs.writeFileSync(fileD, '<map><topicref href="E.ditamap"/></map>');
        fs.writeFileSync(fileE, '<map><topicref href="C.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
            const msg = cycleDiags[0].message.toLowerCase();
            assert.ok(msg.includes('c.ditamap'));
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('duplicate cycle from multiple refs is reported only once', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.ditamap');
        const fileB = path.join(tmpDir, 'B.ditamap');

        // A has two refs to B, and B refs back to A — only 1 cycle diagnostic
        fs.writeFileSync(fileA, '<map><topicref href="B.ditamap"/><mapref href="B.ditamap"/></map>');
        fs.writeFileSync(fileB, '<map><topicref href="A.ditamap"/></map>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
