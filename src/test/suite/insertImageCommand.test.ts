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
    copyImageIntoDirectory,
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

        test('Should return undefined when the image is on a different drive than the document (regression, Windows-only)', function() {
            // path.relative() has no common root to compute from across
            // Windows drive letters and falls back to returning the
            // absolute target path unchanged — not a valid relative href.
            // POSIX always has a common root ('/'), so this case can't be
            // reproduced there; skip on non-Windows the same way
            // keySpaceResolver.test.ts guards its own platform-specific
            // path-casing tests.
            if (process.platform !== 'win32') {
                this.skip();
                return;
            }
            const dir = 'C:\\workspace\\topics';
            const image = 'D:\\shared\\diagram.png';
            assert.strictEqual(computeImageHref(dir, image), undefined);
        });
    });

    suite('buildImageSnippet', () => {
        test('Should build a bare <image> when neither caption nor alt is given', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', ''),
                '<image href="images/diagram.png"/>'
            );
        });

        test('Should emit alt as an <alt> child element, not the deprecated @alt attribute (regression)', () => {
            // @alt is deprecated (DITA-SCH-011) for DITA 1.0-1.3 — emitting
            // it here would make every image inserted with alt text
            // immediately flag a warning on its own generated markup.
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', 'Architecture diagram'),
                '<image href="images/diagram.png">\n    <alt>Architecture diagram</alt>\n</image>'
            );
        });

        test('Should wrap in <fig><title> when a caption is given, nesting a multi-line <image> correctly', () => {
            const snippet = buildImageSnippet('images/diagram.png', 'Architecture Overview', 'Architecture diagram');
            assert.strictEqual(
                snippet,
                '<fig>\n' +
                '    <title>Architecture Overview</title>\n' +
                '    <image href="images/diagram.png">\n' +
                '        <alt>Architecture diagram</alt>\n' +
                '    </image>\n' +
                '</fig>'
            );
        });

        test('Should wrap a bare <image> in <fig><title> when a caption is given without alt text', () => {
            const snippet = buildImageSnippet('images/diagram.png', 'Architecture Overview', '');
            assert.strictEqual(
                snippet,
                '<fig>\n    <title>Architecture Overview</title>\n    <image href="images/diagram.png"/>\n</fig>'
            );
        });

        test('Should XML-escape special characters in href/caption/alt (regression)', () => {
            const snippet = buildImageSnippet('img & <x>.png', 'A "B" & C', 'D < E');
            assert.ok(snippet.includes('img &amp; &lt;x&gt;.png'), 'href should be escaped');
            assert.ok(snippet.includes('A &quot;B&quot; &amp; C'), 'caption should be escaped');
            assert.ok(snippet.includes('D &lt; E'), 'alt should be escaped');
        });

        test('Should include width/height attributes when a size is given', () => {
            const snippet = buildImageSnippet('images/diagram.png', '', '', { width: '200', height: '150' });
            assert.strictEqual(snippet, '<image href="images/diagram.png" width="200" height="150"/>');
        });

        test('Should include only the attributes actually set (partial size)', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', '', { width: '200' }),
                '<image href="images/diagram.png" width="200"/>'
            );
        });

        test('Should include scale when given', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', '', { scale: '50' }),
                '<image href="images/diagram.png" scale="50"/>'
            );
        });

        test('Should combine size attributes with alt text', () => {
            const snippet = buildImageSnippet('images/diagram.png', '', 'Diagram', { width: '200' });
            assert.strictEqual(
                snippet,
                '<image href="images/diagram.png" width="200">\n    <alt>Diagram</alt>\n</image>'
            );
        });

        test('Should not emit any size attributes when size is undefined or empty', () => {
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', '', undefined),
                '<image href="images/diagram.png"/>'
            );
            assert.strictEqual(
                buildImageSnippet('images/diagram.png', '', '', {}),
                '<image href="images/diagram.png"/>'
            );
        });
    });

    suite('copyImageIntoDirectory', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        const sourceImage = path.join(fixturesPath, 'images', 'diagram.png');
        let targetDir: string;

        setup(() => {
            targetDir = path.join(fixturesPath, `temp-copy-target-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        });

        teardown(() => {
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
        });

        test('Should create the target directory and copy the file into it', async () => {
            const result = await copyImageIntoDirectory(sourceImage, targetDir);
            assert.strictEqual(result, path.join(targetDir, 'diagram.png'));
            assert.ok(fs.existsSync(result), 'the copied file should exist');
            assert.ok(fs.readFileSync(result).equals(fs.readFileSync(sourceImage)), 'copied content should match the source');
        });

        test('Should reuse an existing byte-identical file instead of duplicating it (regression)', async () => {
            const first = await copyImageIntoDirectory(sourceImage, targetDir);
            const second = await copyImageIntoDirectory(sourceImage, targetDir);
            assert.strictEqual(second, first, 're-copying the same source should reuse the existing file, not create diagram-1.png');
            assert.strictEqual(fs.readdirSync(targetDir).length, 1, 'only one file should exist in the target directory');
        });

        test('Should append a numbered suffix when a different file already occupies the target name (regression)', async () => {
            fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, 'diagram.png'), 'not the same content');

            const result = await copyImageIntoDirectory(sourceImage, targetDir);

            assert.strictEqual(result, path.join(targetDir, 'diagram-1.png'));
            assert.ok(fs.readFileSync(result).equals(fs.readFileSync(sourceImage)));
            // The pre-existing, unrelated file must be left untouched.
            assert.strictEqual(fs.readFileSync(path.join(targetDir, 'diagram.png'), 'utf-8'), 'not the same content');
        });
    });

    suite('insertImageCommand (orchestration)', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        let sandbox: sinon.SinonSandbox;
        let tempFile: string | undefined;
        let extraCleanupDirs: string[];

        setup(() => {
            sandbox = sinon.createSandbox();
            extraCleanupDirs = [];
        });

        teardown(async () => {
            sandbox.restore();
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            tempFile = undefined;
            for (const dir of extraCleanupDirs) {
                if (fs.existsSync(dir)) {
                    fs.rmSync(dir, { recursive: true, force: true });
                }
            }
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

        /**
         * Like `openTempTopic`, but in a fresh subdirectory of its own
         * rather than directly in `fixturesPath` — needed for the
         * copy-into-workspace tests below, where the topic's sibling
         * `images/` directory must be genuinely distinct from the fixture
         * image's own `fixturesPath/images/` directory (source and
         * destination coinciding by construction would make "copy" and
         * "reference" produce the exact same file, defeating the test).
         */
        async function openTempTopicInFreshDir(): Promise<{ editor: vscode.TextEditor; topicDir: string }> {
            const topicDir = path.join(fixturesPath, `temp-insert-image-dir-${Date.now()}-${Math.random().toString(36).slice(2)}`);
            fs.mkdirSync(topicDir, { recursive: true });
            extraCleanupDirs.push(topicDir);

            const filePath = path.join(topicDir, 'topic.dita');
            const content =
                '<?xml version="1.0" encoding="UTF-8"?>\n' +
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n' +
                '<topic id="temp_topic">\n' +
                '    <title>Temp Topic</title>\n' +
                '    <body>\n' +
                '        \n' +
                '    </body>\n' +
                '</topic>\n';
            fs.writeFileSync(filePath, content, 'utf-8');

            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            const editor = await vscode.window.showTextDocument(document);
            return { editor, topicDir };
        }

        /**
         * Makes `fixturesPath` (and everything under it — the temp topic
         * files this suite creates, and the `images/` fixture) register as
         * "inside the workspace" so the new "image is outside the
         * workspace" copy-prompt doesn't fire for tests that predate it and
         * aren't testing that flow — the "workspace is open AND the image
         * is under one of its folders" path specifically (as opposed to the
         * separate "no workspace is open at all" shortcut, covered by its
         * own dedicated test below, which needs no stub at all).
         *
         * Stubs `vscode.workspace.getWorkspaceFolder` *directly*, alongside
         * `workspaceFolders` — not `workspaceFolders` alone (regression: an
         * earlier version of this suite stubbed only the `workspaceFolders`
         * property, on the assumption `getWorkspaceFolder()` derives its
         * answer from it; in this VS Code test host it evidently does not
         * — it kept returning `undefined` regardless, routing every
         * "already in workspace" test through the real outside-workspace
         * `showQuickPick` prompt unstubbed, which either hung waiting for
         * real UI input, a 10s test timeout, or silently cancelled the
         * command, cascading into unrelated-looking failures on every test
         * declared after the first one to hit it).
         */
        function stubWorkspaceFolderCoveringFixtures(): void {
            const fixturesFolder: vscode.WorkspaceFolder = {
                uri: vscode.Uri.file(fixturesPath),
                name: 'fixtures',
                index: 0
            };
            sandbox.stub(vscode.workspace, 'workspaceFolders').value([fixturesFolder]);
            sandbox.stub(vscode.workspace, 'getWorkspaceFolder').callsFake((uri: vscode.Uri) => {
                const normalized = path.normalize(uri.fsPath);
                return normalized.startsWith(path.normalize(fixturesPath)) ? fixturesFolder : undefined;
            });
        }

        /**
         * Simulates a workspace being open, but not covering the picked
         * image — for tests exercising the outside-workspace copy/reference
         * prompt specifically. Only `workspaceFolders` needs stubbing here:
         * `getWorkspaceFolder()`'s real (unstubbed) behavior already
         * returns `undefined` for everything in this test host (no real
         * workspace is ever actually registered at the Electron level), so
         * it naturally reports "not in this folder" without needing its own
         * stub.
         */
        function stubWorkspaceOpenElsewhere(): void {
            sandbox.stub(vscode.workspace, 'workspaceFolders').value([
                { uri: vscode.Uri.file(path.join(fixturesPath, '..', '..')), name: 'unrelated', index: 0 }
            ]);
        }

        /**
         * Routes `showQuickPick` by its `title` — this command now shows up
         * to two different QuickPicks in one run (the outside-workspace
         * choice, conditionally, and the size choice, always), so a single
         * positional `.onCall(n)` stub can't express both a test's specific
         * response and "this prompt should never fire" for the other.
         * Titles not present in `byTitle` resolve to `undefined` (Escape),
         * matching how an un-stubbed prompt safely cancels the command
         * instead of hanging.
         */
        function stubQuickPicksByTitle(byTitle: Record<string, { value: string } | undefined>): sinon.SinonStub {
            return sandbox.stub(vscode.window, 'showQuickPick').callsFake((_items: unknown, options?: unknown) => {
                const title = (options as vscode.QuickPickOptions | undefined)?.title ?? '';
                if (!(title in byTitle)) {
                    return Promise.resolve(undefined);
                }
                const response = byTitle[title];
                return Promise.resolve(response ? ({ label: '', ...response } as unknown as vscode.QuickPickItem) : undefined);
            });
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

        test('Should not prompt to copy when no workspace is open at all (regression)', async () => {
            // "Copy into the workspace" is meaningless with no workspace to
            // copy into — this must fall straight through to the original
            // v1 behavior (direct href computation, no extra QuickPick),
            // not force a prompt just because getWorkspaceFolder() trivially
            // returns undefined for everything in single-file mode.
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const quickPickStub = stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'none' } });
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');

            await insertImageCommand();

            assert.strictEqual(
                quickPickStub.neverCalledWith(sinon.match.any, sinon.match({ title: 'Image Is Outside the Workspace' })),
                true,
                'the outside-workspace prompt should never be shown when no workspace is open'
            );
            assert.ok(editor.document.getText().includes('<image href="images/diagram.png"/>'));
        });

        test('Should do nothing when the outside-workspace prompt is escaped (regression)', async () => {
            const editor = await openTempTopic();
            stubWorkspaceOpenElsewhere();
            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            stubQuickPicksByTitle({}); // workspace is open, but doesn't cover the image — prompt fires and resolves undefined
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            const originalText = editor.document.getText();

            await insertImageCommand();

            assert.strictEqual(inputBoxStub.called, false, 'should not prompt for caption after the outside-workspace prompt is cancelled');
            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged');
        });

        test('Should do nothing when the caption prompt is escaped', async () => {
            const editor = await openTempTopic();
            stubWorkspaceFolderCoveringFixtures();
            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
            const originalText = editor.document.getText();

            await insertImageCommand();

            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged');
        });

        test('Should do nothing when the size prompt is escaped (regression)', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();
            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');
            stubQuickPicksByTitle({}); // "Image Size (optional)" resolves undefined
            const originalText = editor.document.getText();

            await insertImageCommand();

            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged when the size step is escaped');
        });

        test('Should insert a bare <image> at the cursor when no caption or size is given', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'none' } });

            await insertImageCommand();

            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png"/>'),
                'a bare <image> element should be inserted with the computed href'
            );
        });

        test('Should insert a <fig> skeleton when a caption is given, prefilling alt from the caption', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('Architecture Overview');
            inputBoxStub.onCall(1).callsFake((options) =>
                Promise.resolve((options as vscode.InputBoxOptions | undefined)?.value ?? '')
            );
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'none' } });

            await insertImageCommand();

            const text = editor.document.getText();
            assert.ok(text.includes('<fig>'), 'should wrap in <fig> when a caption is given');
            assert.ok(text.includes('<title>Architecture Overview</title>'), 'should include the caption as <title>');
            assert.ok(text.includes('<alt>Architecture Overview</alt>'), 'alt should default to the caption text');
        });

        test('Should insert width/height attributes when set (regression)', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves(''); // caption
            inputBoxStub.onCall(1).resolves(''); // alt
            inputBoxStub.onCall(2).resolves('200'); // width
            inputBoxStub.onCall(3).resolves('150'); // height
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'dimensions' } });

            await insertImageCommand();

            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png" width="200" height="150"/>'),
                'width and height should both be set'
            );
        });

        test('Should insert a bare image when width and height are both left empty (regression)', async () => {
            // Choosing "dimensions" and then leaving both fields blank must
            // behave identically to choosing "no size attributes" — not
            // silently attach an empty-but-defined size object internally
            // (fixed alongside the "scale" branch's equivalent case, which
            // already returned undefined for an empty value).
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves(''); // caption
            inputBoxStub.onCall(1).resolves(''); // alt
            inputBoxStub.onCall(2).resolves(''); // width, left empty
            inputBoxStub.onCall(3).resolves(''); // height, left empty
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'dimensions' } });

            await insertImageCommand();

            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png"/>'),
                'no size attributes should be present when both fields are left empty'
            );
        });

        test('Should insert only scale when the scale option is chosen (regression)', async () => {
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves(''); // caption
            inputBoxStub.onCall(1).resolves(''); // alt
            inputBoxStub.onCall(2).resolves('50'); // scale
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'scale' } });

            await insertImageCommand();

            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png" scale="50"/>'),
                'scale should be set and width/height omitted'
            );
        });

        test('Should reject a non-NMTOKEN size value via validateInput (regression)', async () => {
            // Exercise the InputBox's own validateInput function directly —
            // the same way the rest of this project's insert-command test
            // suites verify a QuickInput's bounds/format checking (see
            // insertTableCommand.test.ts's own validateInput coverage).
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            stubWorkspaceFolderCoveringFixtures();

            const picked = vscode.Uri.file(path.join(fixturesPath, 'images', 'diagram.png'));
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');
            inputBoxStub.onCall(2).callsFake((options) => {
                const validate = (options as vscode.InputBoxOptions | undefined)?.validateInput;
                assert.strictEqual(typeof validate, 'function');
                assert.strictEqual(validate!('50%'), 'Must be a plain number or simple token (no spaces or %) — DITA\'s width/height/scale attributes are NMTOKEN values.');
                assert.strictEqual(validate!('200'), undefined);
                assert.strictEqual(validate!(''), undefined, 'empty should be a valid "omit" value');
                return Promise.resolve('50');
            });
            stubQuickPicksByTitle({ 'Image Size (optional)': { value: 'scale' } });

            await insertImageCommand();

            assert.ok(editor.document.getText().includes('scale="50"'));
        });

        test('Should show an error and insert nothing when the image is on a different drive than the document (regression, Windows-only)', async function() {
            if (process.platform !== 'win32') {
                this.skip();
                return;
            }
            const editor = await openTempTopic();
            positionOnBlankBodyLine(editor);
            const originalText = editor.document.getText();

            // Derive a drive letter guaranteed to differ from wherever this
            // checkout actually lives (GitHub's windows-latest runners use
            // D:\, not the C:\ this test originally assumed — hardcoding
            // either one risks picking the *same* drive as the real
            // checkout and silently not exercising the cross-drive case).
            const documentDrive = path.parse(editor.document.uri.fsPath).root.charAt(0).toUpperCase();
            const otherDrive = documentDrive === 'D' ? 'C' : 'D';
            const picked = vscode.Uri.file(`${otherDrive}:\\shared\\diagram.png`);
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const errorStub = sandbox.stub(vscode.window, 'showErrorMessage');
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            // No workspace open in this test host, so resolveImageHref
            // skips the outside-workspace prompt entirely (nothing to copy
            // into) and goes straight to computeImageHref — landing on the
            // cross-drive failure this test targets without needing a
            // showQuickPick stub at all.

            await insertImageCommand();

            assert.ok(errorStub.calledOnce, 'should show an error instead of inserting an invalid href');
            assert.strictEqual(inputBoxStub.called, false, 'should not prompt for caption/alt after an unresolvable href');
            assert.strictEqual(editor.document.getText(), originalText, 'document should be unchanged');
        });

        test('Should offer to copy an out-of-workspace image in, and insert the copy\'s relative href (regression)', async () => {
            const { editor, topicDir } = await openTempTopicInFreshDir();
            positionOnBlankBodyLine(editor);
            // A workspace is open, but doesn't cover the picked image —
            // exercising the real "outside workspace" path (as opposed to
            // the separate "no workspace open at all" shortcut).
            stubWorkspaceOpenElsewhere();

            const sourceImage = path.join(fixturesPath, 'images', 'diagram.png');
            const picked = vscode.Uri.file(sourceImage);
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');
            stubQuickPicksByTitle({
                'Image Is Outside the Workspace': { value: 'copy' },
                'Image Size (optional)': { value: 'none' }
            });

            await insertImageCommand();

            const copiedPath = path.join(topicDir, 'images', 'diagram.png');
            assert.ok(fs.existsSync(copiedPath), 'the image should have been copied into images/ next to the topic');
            assert.ok(
                fs.readFileSync(copiedPath).equals(fs.readFileSync(sourceImage)),
                'the copy\'s content should match the source image'
            );
            assert.ok(
                editor.document.getText().includes('<image href="images/diagram.png"/>'),
                'the inserted href should point at the copy, relative to the topic'
            );
        });

        test('Should reference the original location without copying when the user declines (regression)', async () => {
            const { editor, topicDir } = await openTempTopicInFreshDir();
            positionOnBlankBodyLine(editor);
            stubWorkspaceOpenElsewhere();

            const sourceImage = path.join(fixturesPath, 'images', 'diagram.png');
            const picked = vscode.Uri.file(sourceImage);
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([picked]);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('');
            inputBoxStub.onCall(1).resolves('');
            stubQuickPicksByTitle({
                'Image Is Outside the Workspace': { value: 'reference' },
                'Image Size (optional)': { value: 'none' }
            });

            await insertImageCommand();

            const wouldBeCopyDir = path.join(topicDir, 'images');
            assert.strictEqual(fs.existsSync(wouldBeCopyDir), false, 'nothing should be copied when the user declines');
            const expectedHref = computeImageHref(topicDir, sourceImage);
            assert.ok(
                editor.document.getText().includes(`<image href="${expectedHref}"/>`),
                'should reference the original image at its actual (unmoved) relative path'
            );
        });
    });
});
