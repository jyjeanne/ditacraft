/**
 * Insert Table Command Test Suite
 * Tests the pure skeleton-building helpers directly, and the command's
 * orchestration via sinon-stubbed vscode.window prompts (the same pattern
 * already established in insertImageCommand.test.ts /
 * publishProfilesCommand.test.ts for this project).
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as sinon from 'sinon';
import {
    insertTableCommand,
    isEligibleDocument,
    buildCalsTableSnippet,
    buildSimpleTableSnippet,
} from '../../commands/insertTableCommand';

suite('Insert Table Command Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    suite('Command Registration', () => {
        test('Should have insertTable command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.insertTable'),
                'ditacraft.insertTable command should be registered'
            );
        });
    });

    suite('isEligibleDocument', () => {
        test('Should accept only .dita (tables are body content, not valid at the map level)', () => {
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'topic.dita'))), true);
        });

        test('Should reject .ditamap/.bookmap/.ditaval and unrelated extensions', () => {
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'root.ditamap'))), false);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'book.bookmap'))), false);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'filter.ditaval'))), false);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'notes.txt'))), false);
        });
    });

    suite('buildCalsTableSnippet', () => {
        test('Should build a table with the exact requested column/row counts and no title', () => {
            const snippet = buildCalsTableSnippet(2, 1, false, undefined);
            assert.strictEqual(
                snippet,
                '<table>\n' +
                '    <tgroup cols="2">\n' +
                '        <colspec colname="c1" colwidth="1*"/>\n' +
                '        <colspec colname="c2" colwidth="1*"/>\n' +
                '        <tbody>\n' +
                '            <row>\n' +
                '                <entry/>\n' +
                '                <entry/>\n' +
                '            </row>\n' +
                '        </tbody>\n' +
                '    </tgroup>\n' +
                '</table>'
            );
        });

        test('Should include a <title> only when one is given', () => {
            const withTitle = buildCalsTableSnippet(1, 1, false, 'My Title');
            const withoutTitle = buildCalsTableSnippet(1, 1, false, undefined);
            assert.ok(withTitle.includes('<title>My Title</title>'));
            assert.ok(!withoutTitle.includes('<title>'));
        });

        test('Should include a <thead> with one <entry> per column only when a header is requested', () => {
            const withHeader = buildCalsTableSnippet(3, 1, true, undefined);
            const withoutHeader = buildCalsTableSnippet(3, 1, false, undefined);
            assert.ok(withHeader.includes('<thead>'));
            assert.strictEqual((withHeader.match(/<entry>Column \d<\/entry>/g) || []).length, 3);
            assert.ok(!withoutHeader.includes('<thead>'));
        });

        test('Every colspec/row/header must have exactly `columns` entries -- no mismatch (regression)', () => {
            const columns = 4;
            const rows = 3;
            const snippet = buildCalsTableSnippet(columns, rows, true, undefined);

            assert.strictEqual((snippet.match(/<colspec /g) || []).length, columns);
            assert.strictEqual((snippet.match(/<entry>Column \d<\/entry>/g) || []).length, columns, 'header entry count must match column count');
            assert.strictEqual((snippet.match(/<entry\/>/g) || []).length, columns * rows, 'every body row must have exactly `columns` entries');
            assert.strictEqual((snippet.match(/<row>/g) || []).length, rows + 1, 'one header row plus `rows` body rows');
            assert.strictEqual(snippet.includes(`cols="${columns}"`), true, 'tgroup/@cols must match the actual colspec count');
        });

        test('Should XML-escape the title', () => {
            const snippet = buildCalsTableSnippet(1, 1, false, 'Setup & Config <required>');
            assert.ok(snippet.includes('<title>Setup &amp; Config &lt;required&gt;</title>'));
        });
    });

    suite('buildSimpleTableSnippet', () => {
        test('Should build a simpletable with exactly `columns` <stentry> per row and no <title> support', () => {
            const snippet = buildSimpleTableSnippet(2, 1, false);
            assert.strictEqual(
                snippet,
                '<simpletable>\n' +
                '    <strow>\n' +
                '        <stentry/>\n' +
                '        <stentry/>\n' +
                '    </strow>\n' +
                '</simpletable>'
            );
            assert.ok(!snippet.includes('<title>'), 'simpletable has no <title> child per its DITA content model');
        });

        test('Should include an <sthead> with one <stentry> per column only when a header is requested', () => {
            const withHeader = buildSimpleTableSnippet(3, 1, true);
            const withoutHeader = buildSimpleTableSnippet(3, 1, false);
            assert.ok(withHeader.includes('<sthead>'));
            assert.strictEqual((withHeader.match(/<stentry>Column \d<\/stentry>/g) || []).length, 3);
            assert.ok(!withoutHeader.includes('<sthead>'));
        });

        test('Every strow/sthead must have exactly `columns` stentries -- no mismatch (regression)', () => {
            const columns = 5;
            const rows = 2;
            const snippet = buildSimpleTableSnippet(columns, rows, true);

            assert.strictEqual((snippet.match(/<stentry>Column \d<\/stentry>/g) || []).length, columns);
            assert.strictEqual((snippet.match(/<stentry\/>/g) || []).length, columns * rows);
            assert.strictEqual((snippet.match(/<strow>/g) || []).length, rows);
        });
    });

    suite('insertTableCommand (orchestration)', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        let sandbox: sinon.SinonSandbox;
        let tempFile: string | undefined;

        setup(() => {
            sandbox = sinon.createSandbox();
        });

        teardown(async () => {
            sandbox.restore();
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            tempFile = undefined;
        });

        /** Opens a fresh temp .dita topic with a blank line inside <body> for the cursor. */
        async function openTempTopic(): Promise<vscode.TextEditor> {
            tempFile = path.join(fixturesPath, `temp-insert-table-${Date.now()}-${Math.random().toString(36).slice(2)}.dita`);
            const content =
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n' +
                '<topic id="temp_topic">\n' +
                '    <title>Temp Topic</title>\n' +
                '    <body>\n' +
                '        \n' +
                '    </body>\n' +
                '</topic>\n';
            fs.writeFileSync(tempFile, content, 'utf-8');
            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tempFile));
            return vscode.window.showTextDocument(document);
        }

        function positionOnBlankBodyLine(editor: vscode.TextEditor): void {
            const lines = editor.document.getText().split('\n');
            const bodyLine = lines.findIndex(l => l.trim() === '');
            const position = new vscode.Position(bodyLine, lines[bodyLine].length);
            editor.selection = new vscode.Selection(position, position);
        }

        test('Should warn and do nothing when there is no eligible active editor', async () => {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            const warnStub = sandbox.stub(vscode.window, 'showWarningMessage');
            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');

            await insertTableCommand();

            assert.ok(warnStub.calledOnce);
            assert.strictEqual(quickPickStub.called, false);
        });

        test('Should insert a CALS table with a title at the cursor', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);

            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'CALS Table', value: 'table' } as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(1).resolves({ label: '$(check) Yes', value: true } as unknown as vscode.QuickPickItem);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('2'); // columns
            inputBoxStub.onCall(1).resolves('1'); // rows
            inputBoxStub.onCall(2).resolves('My Table'); // title

            await insertTableCommand();

            const text = editor.document.getText();
            assert.ok(text.includes('<table>'));
            assert.ok(text.includes('<title>My Table</title>'));
            assert.ok(text.includes('cols="2"'));
            assert.strictEqual((text.match(/<entry\/>/g) || []).length, 2);
        });

        test('Should insert a simpletable without prompting for a title', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);

            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'Simple Table', value: 'simpletable' } as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(1).resolves({ label: '$(circle-slash) No', value: false } as unknown as vscode.QuickPickItem);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('3'); // columns
            inputBoxStub.onCall(1).resolves('2'); // rows

            await insertTableCommand();

            const text = editor.document.getText();
            assert.ok(text.includes('<simpletable>'));
            assert.strictEqual(inputBoxStub.callCount, 2, 'simpletable must not prompt for a title (it has none in its content model)');
        });

        test('Should cancel without inserting anything when the table type picker is escaped', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            const originalText = editor.document.getText();

            sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');

            await insertTableCommand();

            assert.strictEqual(inputBoxStub.called, false);
            assert.strictEqual(editor.document.getText(), originalText);
        });

        test('Should cancel without inserting anything when the row-count prompt is escaped', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            const originalText = editor.document.getText();

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Simple Table', value: 'simpletable' } as unknown as vscode.QuickPickItem);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('2'); // columns
            inputBoxStub.onCall(1).resolves(undefined); // escape on rows

            await insertTableCommand();

            assert.strictEqual(editor.document.getText(), originalText);
        });

        test('Column-count prompt should reject out-of-range and non-integer input (validateInput)', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Simple Table', value: 'simpletable' } as unknown as vscode.QuickPickItem);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).callsFake(async (options) => {
                const validate = (options as vscode.InputBoxOptions).validateInput;
                assert.ok(validate, 'the column-count prompt must validate its input');
                assert.ok(await validate!('0'), 'below minimum should be rejected');
                assert.ok(await validate!('21'), 'above the 20-column maximum should be rejected');
                assert.ok(await validate!('abc'), 'non-numeric input should be rejected');
                assert.strictEqual(await validate!('5'), null, 'a valid count should be accepted');
                return '5';
            });
            inputBoxStub.onCall(1).resolves('1');

            await insertTableCommand();

            const text = editor.document.getText();
            assert.ok(text.includes('<simpletable>'), 'the command should still complete once a valid count is entered');
            assert.strictEqual((text.match(/<stentry\/>/g) || []).length, 5, 'the accepted column count should be used');
        });
    });
});
