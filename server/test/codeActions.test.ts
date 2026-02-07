import * as assert from 'assert';
import { handleCodeActions } from '../src/features/codeActions';
import { createDoc, createDocs, TEST_URI } from './helper';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';

function makeDiag(
    code: string,
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number
): Diagnostic {
    return {
        range: Range.create(startLine, startChar, endLine, endChar),
        message: `Test diagnostic ${code}`,
        severity: DiagnosticSeverity.Warning,
        source: 'dita-lsp',
        code,
    };
}

function actions(content: string, diagnostics: Diagnostic[]) {
    const doc = createDoc(content);
    const docs = createDocs(doc);
    return handleCodeActions(
        {
            textDocument: { uri: TEST_URI },
            range: Range.create(0, 0, 0, 0),
            context: { diagnostics },
        },
        docs
    );
}

suite('handleCodeActions', () => {
    suite('Missing DOCTYPE fix', () => {
        test('offers fix for missing DOCTYPE on topic', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const diag = makeDiag('DITA-STRUCT-001', 0, 0, 0, 5);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('DOCTYPE'));
            assert.ok(result[0].title.includes('topic'));
        });

        test('offers fix for missing DOCTYPE on concept', () => {
            const content = '<concept id="c1"><title>C</title></concept>';
            const diag = makeDiag('DITA-STRUCT-001', 0, 0, 0, 7);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('concept'));
        });

        test('offers fix for missing DOCTYPE on map', () => {
            const content = '<map><title>M</title></map>';
            const diag = makeDiag('DITA-STRUCT-001', 0, 0, 0, 3);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('map'));
        });

        test('no fix for unknown root element', () => {
            const content = '<div>text</div>';
            const diag = makeDiag('DITA-STRUCT-001', 0, 0, 0, 3);
            const result = actions(content, [diag]);
            assert.strictEqual(result.length, 0);
        });
    });

    suite('Missing ID fix', () => {
        test('offers fix for missing id on topic', () => {
            const content = '<topic ><title>T</title></topic>';
            const diag = makeDiag('DITA-STRUCT-003', 0, 0, 0, 6);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('id='));
        });

        test('id derived from filename', () => {
            const content = '<topic ><title>T</title></topic>';
            const doc = createDoc(content, 'file:///my-topic.dita');
            const docs = createDocs(doc);
            const diag = makeDiag('DITA-STRUCT-003', 0, 0, 0, 6);
            const result = handleCodeActions(
                {
                    textDocument: { uri: 'file:///my-topic.dita' },
                    range: Range.create(0, 0, 0, 0),
                    context: { diagnostics: [diag] },
                },
                docs
            );
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('my-topic'));
        });
    });

    suite('Missing title fix', () => {
        test('offers fix for missing title', () => {
            const content = '<topic id="t1"><body><p>text</p></body></topic>';
            const diag = makeDiag('DITA-STRUCT-004', 0, 0, 0, 5);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('<title>'));
        });

        test('edit inserts after root opening tag', () => {
            const content = '<topic id="t1"><body></body></topic>';
            const diag = makeDiag('DITA-STRUCT-004', 0, 0, 0, 5);
            const result = actions(content, [diag]);
            assert.ok(result.length > 0);
            const edit = result[0].edit;
            assert.ok(edit);
            const changes = edit.changes;
            assert.ok(changes);
            const textEdits = changes[TEST_URI];
            assert.ok(textEdits && textEdits.length > 0);
            assert.ok(textEdits[0].newText.includes('<title>'));
        });
    });

    suite('Empty element fix', () => {
        test('offers fix to remove empty element', () => {
            const content = '<topic id="t1"><title>T</title><body><p></p></body></topic>';
            // <p></p> starts at offset 37, ends at offset 44
            const doc = createDoc(content);
            const startPos = doc.positionAt(37);
            const endPos = doc.positionAt(44);
            const diag: Diagnostic = {
                range: Range.create(startPos, endPos),
                message: 'Empty element <p>',
                severity: DiagnosticSeverity.Warning,
                source: 'dita-lsp',
                code: 'DITA-STRUCT-005',
            };
            const docs = createDocs(doc);
            const result = handleCodeActions(
                {
                    textDocument: { uri: TEST_URI },
                    range: Range.create(0, 0, 0, 0),
                    context: { diagnostics: [diag] },
                },
                docs
            );
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('Remove'));
            assert.ok(result[0].title.includes('<p>'));
        });
    });

    suite('Duplicate ID fix', () => {
        test('offers fix to rename duplicate id', () => {
            const content = '<topic id="t1"><title>T</title><p id="dup"/><p id="dup"/></topic>';
            // second id="dup" starts at the second <p
            const doc = createDoc(content);
            const secondPOffset = content.indexOf('<p id="dup"/>', content.indexOf('<p id="dup"/>') + 1);
            const startPos = doc.positionAt(secondPOffset);
            const endPos = doc.positionAt(secondPOffset + 13);
            const diag: Diagnostic = {
                range: Range.create(startPos, endPos),
                message: 'Duplicate id "dup"',
                severity: DiagnosticSeverity.Error,
                source: 'dita-lsp',
                code: 'DITA-ID-001',
            };
            const docs = createDocs(doc);
            const result = handleCodeActions(
                {
                    textDocument: { uri: TEST_URI },
                    range: Range.create(0, 0, 0, 0),
                    context: { diagnostics: [diag] },
                },
                docs
            );
            assert.ok(result.length > 0);
            assert.ok(result[0].title.includes('Rename'));
        });
    });

    suite('No diagnostics / unknown codes', () => {
        test('no diagnostics returns no actions', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = actions(content, []);
            assert.strictEqual(result.length, 0);
        });

        test('unknown diagnostic code returns no actions', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const diag = makeDiag('UNKNOWN-CODE', 0, 0, 0, 5);
            const result = actions(content, [diag]);
            assert.strictEqual(result.length, 0);
        });

        test('diagnostic from different source is ignored', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const diag: Diagnostic = {
                range: Range.create(0, 0, 0, 5),
                message: 'Some error',
                severity: DiagnosticSeverity.Error,
                source: 'other-source',
                code: 'DITA-STRUCT-001',
            };
            const result = actions(content, [diag]);
            assert.strictEqual(result.length, 0);
        });

        test('document not found returns empty', () => {
            const docs = createDocs(); // empty
            const diag = makeDiag('DITA-STRUCT-001', 0, 0, 0, 5);
            const result = handleCodeActions(
                {
                    textDocument: { uri: 'file:///nonexistent.dita' },
                    range: Range.create(0, 0, 0, 0),
                    context: { diagnostics: [diag] },
                },
                docs
            );
            assert.strictEqual(result.length, 0);
        });
    });
});
