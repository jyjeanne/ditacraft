/**
 * Insert Image Command Test Suite
 * Tests the pure href/snippet-building helpers directly, and the
 * command's orchestration via sinon-stubbed vscode.window prompts (the
 * same pattern already established in publishProfilesCommand.test.ts /
 * cspellSetupCommand.test.ts for this project).
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as sinon from 'sinon';
import {
    insertImageCommand,
    isEligibleDocument,
    computeImageHref,
    buildImageSnippet,
} from '../../commands/insertImageCommand';

suite('Insert Image Command Test Suite', () => {
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
        test('Should have insertImage command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.insertImage'),
                'ditacraft.insertImage command should be registered'
            );
        });
    });

    suite('isEligibleDocument', () => {
        test('Should accept .dita/.ditamap/.bookmap', () => {
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'topic.dita'))), true);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'root.ditamap'))), true);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'book.bookmap'))), true);
        });

        test('Should reject .ditaval (not content) and unrelated extensions', () => {
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'filter.ditaval'))), false);
            assert.strictEqual(isEligibleDocument(vscode.Uri.file(path.join(path.sep, 'x', 'notes.txt'))), false);
        });
    });

    suite('computeImageHref', () => {
        test('Should compute a same-directory relative href', () => {
            const dir = path.join(path.sep, 'workspace', 'topics');
            const image = path.join(dir, 'images', 'diagram.png');
            assert.strictEqual(computeImageHref(dir, image), 'images/diagram.png');
        });

        test('Should compute a parent-directory relative href with forward slashes regardless of platform', () => {
            const dir = path.join(path.sep, 'workspace', 'topics', 'sub');
            const image = path.join(path.sep, 'workspace', 'images', 'diagram.png');
            assert.strictEqual(computeImageHref(dir, image), '../../images/diagram.png');
        });
    });

    suite('buildImageSnippet', () => {
        test('Should build a bare <image> when no caption is given', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', ''),
                '<image href="images/diagram.png"/>'
            );
        });

        test('Should include alt when given', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', 'Architecture diagram'),
                '<image href="images/diagram.png" alt="Architecture diagram"/>'
            );
        });

        test('Should wrap in <fig><title> when a caption is given', () => {
            const snippet = buildImageSnippet('images/diagram.png', 'Architecture Overview', 'Architecture diagram');
            assert.strictEqual(
                snippet,
                '<fig>\n    <title>Architecture Overview</title>\n    <image href="images/diagram.png" alt="Architecture diagram"/>\n</fig>'
            );
        });

        test('Should XML-escape special characters in href/caption/alt (regression)', () => {
            const snippet = buildImageSnippet('img & <x>.png', 'A "B" & C', 'D < E');
            assert.ok(snippet.includes('img &amp; &lt;x&gt;.png'), 'href should be escaped');
            assert.ok(snippet.includes('A &quot;B&quot; &amp; C'), 'caption should be escaped');
            assert.ok(snippet.includes('D &lt; E'), 'alt should be escaped');
        });
    });

    suite('insertImageCommand (orchestration)', () => {
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

        /** Opens a fresh, unsaved-elsewhere temp .dita topic with a blank line inside <body> for the cursor. */
        async function openTempTopic(): Promise<vscode.TextEditor> {
            tempFile = path.join(fixturesPath, `temp-insert-image-${Date.now()}-${Math.random().toString(36).slice(2)}.dita`);
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
            const openDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');

            await insertImageCommand();

            assert.ok(warnStub.calledOnce, 'should warn when no eligible document is active');
            assert.strictEqual(openDialogStub.called, false, 'should not browse without an eligible document');
        });

        test('Should do nothing when the file browse is cancelled', async () => {
            const editor = await openTempTopic();
            sandbox.stub(vscode.window, 'showOpenDialog').resolves(undefined);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            const originalText = editor.document.getText();

            await insertImageCommand();

            assert.strictEqual(inputBoxStub.called, false, 'should not prompt for caption after a cancelled browse');
            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged');
        });

        test('Should do nothing when the caption prompt is escaped', async () => {
            const editor = await openTempTopic();
            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
            const originalText = editor.document.getText();

            await insertImageCommand();

            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged');
        });

        test('Should insert a bare <image> at the cursor when no caption is given', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');

            await insertImageCommand();

            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png"/>'),
                'a bare <image> element should be inserted with the computed href'
            );
        });

        test('Should insert a <fig> skeleton when a caption is given, prefilling alt from the caption', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('Architecture Overview');
            inputBoxStub.onCall(1).callsFake((options) =>
                Promise.resolve((options as vscode.InputBoxOptions | undefined)?.value ?? '')
            );

            await insertImageCommand();

            const text = editor.document.getText();
            assert.ok(text.includes('<fig>'), 'should wrap in <fig> when a caption is given');
            assert.ok(text.includes('<title>Architecture Overview</title>'), 'should include the caption as <title>');
            assert.ok(text.includes('alt="Architecture Overview"'), 'alt should default to the caption text');
        });
    });
});
