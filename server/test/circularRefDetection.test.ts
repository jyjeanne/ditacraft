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

    test('reference escaping the workspace is not followed even if it would close a cycle', async () => {
        // A.ditamap (inside workspaceRoot/docs) references "../../outside.ditamap",
        // which escapes workspaceRoot into a sibling directory. outside.ditamap
        // references back to A.ditamap, which would form a cycle if the escaping
        // reference were followed. With a workspace boundary supplied, DFS must
        // never leave the workspace, so no cycle should be reported.
        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-'));
        const docsDir = path.join(workspaceRoot, 'docs');
        fs.mkdirSync(docsDir);
        const fileA = path.join(docsDir, 'A.ditamap');
        const outsideFile = path.join(os.tmpdir(), 'outside.ditamap');

        fs.writeFileSync(fileA, '<map><topicref href="../../outside.ditamap"/></map>');
        fs.writeFileSync(outsideFile, `<map><topicref href="${fileA.replace(/\\/g, '/')}"/></map>`);

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA, [workspaceRoot]);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 0, 'escaping reference must not be followed');
        } finally {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
            fs.rmSync(outsideFile, { force: true });
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

    test('same-file file-qualified conref to another topic does not report a cycle', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const parametersFile = path.join(tmpDir, 'parameters.dita');
        const settingsFile = path.join(tmpDir, 'settings.dita');

        fs.writeFileSync(parametersFile, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">
<reference id="parameters">
  <title>Parameters</title>
  <refbody><section><p>Intro</p></section></refbody>
  <reference id="base">
    <title>Base</title>
    <refbody><section><div id="copycss-details"><p>Text</p></div></section></refbody>
  </reference>
  <reference id="html5">
    <title>HTML5</title>
    <refbody><section><div conref="parameters.dita#base/copycss-details"/></section></refbody>
  </reference>
</reference>`);

        fs.writeFileSync(settingsFile, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="settings">
  <title>Settings</title>
  <conbody>
    <div conref="parameters.dita#base/copycss-details"/>
  </conbody>
</concept>`);

        const parametersUri = URI.file(parametersFile).toString();
        const settingsUri = URI.file(settingsFile).toString();
        const parametersText = fs.readFileSync(parametersFile, 'utf-8');
        const settingsText = fs.readFileSync(settingsFile, 'utf-8');

        try {
            const parametersDiags = await detectCircularReferences(parametersText, parametersUri, [tmpDir]);
            const settingsDiags = await detectCircularReferences(settingsText, settingsUri, [tmpDir]);
            const parametersCycleDiags = parametersDiags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            const settingsCycleDiags = settingsDiags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(parametersCycleDiags.length, 0);
            assert.strictEqual(settingsCycleDiags.length, 0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('cross-file conref cycle still reports CIRCULAR_REF diagnostic', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        const fileA = path.join(tmpDir, 'A.dita');
        const fileB = path.join(tmpDir, 'B.dita');

        fs.writeFileSync(fileA, '<concept id="a"><title>A</title><conbody><p conref="B.dita#b/pb"/></conbody></concept>');
        fs.writeFileSync(fileB, '<concept id="b"><title>B</title><conbody><p id="pb" conref="A.dita#a/pa"/></conbody></concept>');

        const textA = fs.readFileSync(fileA, 'utf-8');
        const uriA = URI.file(fileA).toString();

        try {
            const diags = await detectCircularReferences(textA, uriA, [tmpDir]);
            const cycleDiags = diags.filter(d => d.code === CYCLE_CODES.CIRCULAR_REF);
            assert.strictEqual(cycleDiags.length, 1);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
