/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as sinon from 'sinon';
import {
    validateFileName,
    generateTopicContent,
    generateMapContent,
    generateBookmapContent,
    humanizeFileName,
    newTopicCommand,
    newMapCommand,
    newBookmapCommand,
    initProjectCommand
} from '../../commands/fileCreationCommands';

suite('File Creation Commands Test Suite', () => {

    suiteSetup(async () => {
        // Get and activate extension
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        // Close all editors after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Command Registration', () => {
        test('Should have newTopic command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newTopic'),
                'ditacraft.newTopic command should be registered'
            );
        });

        test('Should have newMap command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newMap'),
                'ditacraft.newMap command should be registered'
            );
        });

        test('Should have newBookmap command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.newBookmap'),
                'ditacraft.newBookmap command should be registered'
            );
        });

        test('Should have initProject command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.initProject'),
                'ditacraft.initProject command should be registered'
            );
        });
    });

    suite('Command Accessibility', () => {
        test('Commands should be accessible from command palette', async function() {
            this.timeout(5000);

            // Verify commands exist and are callable (even if cancelled by user)
            const commands = await vscode.commands.getCommands(true);

            const expectedCommands = [
                'ditacraft.newTopic',
                'ditacraft.newMap',
                'ditacraft.newBookmap'
            ];

            for (const cmd of expectedCommands) {
                assert.ok(
                    commands.includes(cmd),
                    `Command ${cmd} should be registered`
                );
            }
        });
    });

    suite('File Creation Command Behavior', () => {
        // Note: These tests are limited because file creation commands
        // require user interaction (showQuickPick, showInputBox)
        // Full integration tests would need mocking

        test('newTopic command should exist and be executable', async function() {
            this.timeout(5000);

            // The command should be executable (will prompt for input)
            // We can't test the full flow without mocking user input
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newTopic'));

            // Verify it's a function that can be called
            // Note: This will open a quick pick, which we can't interact with in tests
            // So we just verify the command exists
        });

        test('newMap command should exist and be executable', async function() {
            this.timeout(5000);

            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newMap'));
        });

        test('newBookmap command should exist and be executable', async function() {
            this.timeout(5000);

            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.newBookmap'));
        });
    });

    suite('Command Menu Context', () => {
        test('Commands should be available in command palette', async function() {
            // Verify commands are discoverable
            const commands = await vscode.commands.getCommands(false); // false = only contributed commands

            // These commands should be in the non-internal list
            assert.ok(
                commands.includes('ditacraft.newTopic') ||
                commands.some(c => c.includes('newTopic')),
                'newTopic should be available'
            );
        });
    });

    suite('File Name Validation Logic', () => {
        // Test the validation logic used by file creation commands
        // This tests the pattern used internally

        const FILE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

        test('Should accept valid file names with letters', function() {
            assert.ok(FILE_NAME_PATTERN.test('mytopic'));
            assert.ok(FILE_NAME_PATTERN.test('MyTopic'));
            assert.ok(FILE_NAME_PATTERN.test('TOPIC'));
        });

        test('Should accept valid file names with numbers', function() {
            assert.ok(FILE_NAME_PATTERN.test('topic1'));
            assert.ok(FILE_NAME_PATTERN.test('123topic'));
            assert.ok(FILE_NAME_PATTERN.test('topic123'));
        });

        test('Should accept valid file names with hyphens', function() {
            assert.ok(FILE_NAME_PATTERN.test('my-topic'));
            assert.ok(FILE_NAME_PATTERN.test('my-long-topic-name'));
        });

        test('Should accept valid file names with underscores', function() {
            assert.ok(FILE_NAME_PATTERN.test('my_topic'));
            assert.ok(FILE_NAME_PATTERN.test('my_long_topic_name'));
        });

        test('Should accept mixed valid characters', function() {
            assert.ok(FILE_NAME_PATTERN.test('my-topic_01'));
            assert.ok(FILE_NAME_PATTERN.test('Topic-Name_v2'));
        });

        test('Should reject file names with spaces', function() {
            assert.ok(!FILE_NAME_PATTERN.test('my topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my topic name'));
        });

        test('Should reject file names with special characters', function() {
            assert.ok(!FILE_NAME_PATTERN.test('my.topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my@topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my#topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my$topic'));
            assert.ok(!FILE_NAME_PATTERN.test('my%topic'));
        });

        test('Should reject empty file names', function() {
            assert.ok(!FILE_NAME_PATTERN.test(''));
        });
    });

    suite('Topic Type Templates', () => {
        // Verify the topic types that should be available

        const expectedTopicTypes = ['topic', 'concept', 'task', 'reference'];

        test('Should support standard DITA topic types', function() {
            // These are the types shown in the quick pick
            for (const type of expectedTopicTypes) {
                assert.ok(
                    typeof type === 'string' && type.length > 0,
                    `Topic type ${type} should be valid`
                );
            }
        });
    });

    suite('validateFileName Function', () => {

        test('Should return null for valid file names', () => {
            assert.strictEqual(validateFileName('my-topic'), null);
            assert.strictEqual(validateFileName('my_topic'), null);
            assert.strictEqual(validateFileName('myTopic'), null);
            assert.strictEqual(validateFileName('MyTopic123'), null);
            assert.strictEqual(validateFileName('topic-name-with-dashes'), null);
            assert.strictEqual(validateFileName('a'), null);
            assert.strictEqual(validateFileName('123'), null);
        });

        test('Should return error for empty file name', () => {
            const result = validateFileName('');
            assert.ok(result !== null, 'Should return error message');
            assert.ok(result!.includes('required'), 'Error should mention required');
        });

        test('Should return error for file names with spaces', () => {
            const result = validateFileName('my topic');
            assert.ok(result !== null, 'Should return error message');
        });

        test('Should return error for file names with special characters', () => {
            assert.ok(validateFileName('my.topic') !== null);
            assert.ok(validateFileName('my@topic') !== null);
            assert.ok(validateFileName('my#topic') !== null);
            assert.ok(validateFileName('my$topic') !== null);
            assert.ok(validateFileName('my/topic') !== null);
            assert.ok(validateFileName('my\\topic') !== null);
        });

        test('Should return error for Windows reserved filenames', () => {
            // Test common reserved names
            const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM9', 'LPT1', 'LPT9'];
            for (const name of reservedNames) {
                const result = validateFileName(name);
                assert.ok(result !== null, `Should reject reserved name: ${name}`);
                assert.ok(result!.includes('reserved'), `Error should mention reserved for: ${name}`);
            }
        });

        test('Should reject Windows reserved names case-insensitively', () => {
            assert.ok(validateFileName('con') !== null);
            assert.ok(validateFileName('Con') !== null);
            assert.ok(validateFileName('CON') !== null);
            assert.ok(validateFileName('nul') !== null);
            assert.ok(validateFileName('Nul') !== null);
            assert.ok(validateFileName('com1') !== null);
            assert.ok(validateFileName('Com1') !== null);
        });

        test('Should accept names similar to but not matching reserved names', () => {
            // These should be valid as they're not exact matches
            assert.strictEqual(validateFileName('CON1'), null);
            assert.strictEqual(validateFileName('CONSOLE'), null);
            assert.strictEqual(validateFileName('mycon'), null);
            assert.strictEqual(validateFileName('NULLify'), null);
            assert.strictEqual(validateFileName('COM10'), null);
            assert.strictEqual(validateFileName('LPT10'), null);
        });
    });

    suite('generateTopicContent Function', () => {

        test('Should generate valid topic content', () => {
            const content = generateTopicContent('topic', 'my-topic');

            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE topic'));
            assert.ok(content.includes('<topic id="my-topic">'));
            assert.ok(content.includes('<title>'));
            assert.ok(content.includes('<shortdesc>'));
            assert.ok(content.includes('<body>'));
            assert.ok(content.includes('</topic>'));
        });

        test('Should generate valid concept content', () => {
            const content = generateTopicContent('concept', 'my-concept');

            assert.ok(content.includes('<!DOCTYPE concept'));
            assert.ok(content.includes('<concept id="my-concept">'));
            assert.ok(content.includes('<conbody>'));
            assert.ok(content.includes('</concept>'));
        });

        test('Should generate valid task content', () => {
            const content = generateTopicContent('task', 'my-task');

            assert.ok(content.includes('<!DOCTYPE task'));
            assert.ok(content.includes('<task id="my-task">'));
            assert.ok(content.includes('<taskbody>'));
            assert.ok(content.includes('<steps>'));
            assert.ok(content.includes('<step>'));
            assert.ok(content.includes('<cmd>'));
            assert.ok(content.includes('</task>'));
        });

        test('Should generate valid reference content', () => {
            const content = generateTopicContent('reference', 'my-reference');

            assert.ok(content.includes('<!DOCTYPE reference'));
            assert.ok(content.includes('<reference id="my-reference">'));
            assert.ok(content.includes('<refbody>'));
            assert.ok(content.includes('<properties>'));
            assert.ok(content.includes('</reference>'));
        });

        test('Should default to topic for unknown type', () => {
            const content = generateTopicContent('unknown', 'my-unknown');

            assert.ok(content.includes('<!DOCTYPE topic'));
            assert.ok(content.includes('<topic id="my-unknown">'));
        });

        test('Should use provided ID in content', () => {
            const content = generateTopicContent('topic', 'custom-id-123');
            assert.ok(content.includes('id="custom-id-123"'));
        });
    });

    suite('generateMapContent Function', () => {

        test('Should generate valid map content', () => {
            const content = generateMapContent('my-map');

            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE map'));
            assert.ok(content.includes('<map id="my-map">'));
            assert.ok(content.includes('<title>'));
            assert.ok(content.includes('<topicref'));
            assert.ok(content.includes('href='));
            assert.ok(content.includes('</map>'));
        });

        test('Should use provided ID in content', () => {
            const content = generateMapContent('custom-map-id');
            assert.ok(content.includes('id="custom-map-id"'));
        });

        test('Should include nested topicrefs', () => {
            const content = generateMapContent('test-map');

            const matches = content.match(/<topicref/g);
            assert.ok(matches && matches.length >= 2, 'Should have multiple topicrefs');
        });
    });

    suite('generateBookmapContent Function', () => {

        test('Should generate valid bookmap content', () => {
            const content = generateBookmapContent('My Book Title', 'my-bookmap');

            assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(content.includes('<!DOCTYPE bookmap'));
            assert.ok(content.includes('<bookmap id="my-bookmap">'));
            assert.ok(content.includes('<booktitle>'));
            assert.ok(content.includes('<mainbooktitle>My Book Title</mainbooktitle>'));
            assert.ok(content.includes('<bookmeta>'));
            assert.ok(content.includes('<frontmatter>'));
            assert.ok(content.includes('<chapter'));
            assert.ok(content.includes('<backmatter>'));
            assert.ok(content.includes('</bookmap>'));
        });

        test('Should use provided title in content', () => {
            const content = generateBookmapContent('Custom Title', 'book-id');
            assert.ok(content.includes('<mainbooktitle>Custom Title</mainbooktitle>'));
        });

        test('Should use provided ID in content', () => {
            const content = generateBookmapContent('Title', 'custom-book-id');
            assert.ok(content.includes('id="custom-book-id"'));
        });

        test('Should include creation date', () => {
            const content = generateBookmapContent('Title', 'book-id');
            assert.ok(content.includes('<created date='));

            const dateMatch = content.match(/date="(\d{4}-\d{2}-\d{2})"/);
            assert.ok(dateMatch, 'Should have valid date format');
        });

        test('Should include TOC and index', () => {
            const content = generateBookmapContent('Title', 'book-id');
            assert.ok(content.includes('<toc/>'));
            assert.ok(content.includes('<indexlist/>'));
        });

        test('Should include multiple chapters', () => {
            const content = generateBookmapContent('Title', 'book-id');

            const chapterMatches = content.match(/<chapter/g);
            assert.ok(chapterMatches && chapterMatches.length >= 2, 'Should have multiple chapters');
        });
    });

    suite('Generated Content Validation', () => {

        test('All generated content should have UTF-8 encoding', () => {
            const contents = [
                generateTopicContent('topic', 'test'),
                generateTopicContent('concept', 'test'),
                generateTopicContent('task', 'test'),
                generateTopicContent('reference', 'test'),
                generateMapContent('test'),
                generateBookmapContent('Title', 'test')
            ];

            for (const content of contents) {
                assert.ok(content.includes('encoding="UTF-8"'), 'Should specify UTF-8 encoding');
            }
        });

        test('All generated content should start with XML declaration', () => {
            const contents = [
                generateTopicContent('topic', 'test'),
                generateMapContent('test'),
                generateBookmapContent('Title', 'test')
            ];

            for (const content of contents) {
                assert.ok(content.startsWith('<?xml'), 'Should start with XML declaration');
            }
        });
    });

    suite('humanizeFileName Function', () => {
        test('Should title-case hyphen/underscore-separated words', () => {
            assert.strictEqual(humanizeFileName('my-topic'), 'My Topic');
            assert.strictEqual(humanizeFileName('my_long_topic_name'), 'My Long Topic Name');
            assert.strictEqual(humanizeFileName('mixed-separator_name'), 'Mixed Separator Name');
        });

        test('Should handle a single word', () => {
            assert.strictEqual(humanizeFileName('overview'), 'Overview');
        });

        test('Should collapse consecutive separators', () => {
            assert.strictEqual(humanizeFileName('my--topic__name'), 'My Topic Name');
        });
    });

    /**
     * These suites stub vscode.workspace.workspaceFolders to point at a
     * real temp directory (the sinon pattern already established in
     * cspellSetupCommand.test.ts) rather than relying on a workspace
     * folder being open in this test-electron run, which the rest of this
     * suite's own comments note is typically not the case (single-file
     * mode). This lets the template-integration and Init Wizard paths be
     * exercised end-to-end, including real file writes, verified then
     * cleaned up.
     */
    suite('Template Integration (orchestration)', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        let sandbox: sinon.SinonSandbox;
        let workspaceDir: string;
        let templatesDir: string;
        const config = () => vscode.workspace.getConfiguration('ditacraft');

        setup(() => {
            sandbox = sinon.createSandbox();
            workspaceDir = fs.mkdtempSync(path.join(fixturesPath, 'temp-ws-'));
            templatesDir = fs.mkdtempSync(path.join(fixturesPath, 'temp-tpl-'));
            sandbox.stub(vscode.workspace, 'workspaceFolders').value([
                { uri: vscode.Uri.file(workspaceDir), name: 'test-ws', index: 0 }
            ]);
        });

        teardown(async () => {
            sandbox.restore();
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            fs.rmSync(workspaceDir, { recursive: true, force: true });
            fs.rmSync(templatesDir, { recursive: true, force: true });
            await config().update('templatesPath', undefined, vscode.ConfigurationTarget.Global);
            await config().update('templateAuthor', undefined, vscode.ConfigurationTarget.Global);
        });

        test('newTopicCommand should use a matching template and prompt for its title placeholder', async () => {
            fs.writeFileSync(
                path.join(templatesDir, 'concept.dita'),
                '<?xml version="1.0" encoding="UTF-8"?>\n<concept id="{{id}}"><title>{{title}}</title><author>{{author}}</author></concept>\n',
                'utf8'
            );
            await config().update('templatesPath', templatesDir, vscode.ConfigurationTarget.Global);
            await config().update('templateAuthor', 'Jane Doe', vscode.ConfigurationTarget.Global);

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Concept', value: 'concept' } as unknown as vscode.QuickPickItem);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('my-concept'); // file name
            inputBoxStub.onCall(1).resolves('My Concept Title'); // template title prompt

            await newTopicCommand();

            const written = fs.readFileSync(path.join(workspaceDir, 'my-concept.dita'), 'utf8');
            assert.ok(written.includes('id="my-concept"'), 'id placeholder should be substituted');
            assert.ok(written.includes('<title>My Concept Title</title>'), 'title placeholder should be substituted');
            assert.ok(written.includes('<author>Jane Doe</author>'), 'author placeholder should be substituted');
            assert.strictEqual(inputBoxStub.callCount, 2, 'should prompt for file name, then template title');
        });

        test('newTopicCommand should fall back to the built-in generator when no matching template exists (regression: unchanged when templatesPath is set but has no match)', async () => {
            await config().update('templatesPath', templatesDir, vscode.ConfigurationTarget.Global); // set but empty — no concept.dita in it

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Concept', value: 'concept' } as unknown as vscode.QuickPickItem);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('my-concept');

            await newTopicCommand();

            const written = fs.readFileSync(path.join(workspaceDir, 'my-concept.dita'), 'utf8');
            assert.ok(written.includes('<concept id="my-concept">'), 'should use the built-in generator');
            assert.strictEqual(inputBoxStub.callCount, 1, 'should NOT prompt for a template title when no template was found');
        });

        test('newTopicCommand should cancel without creating a file when the template title prompt is escaped', async () => {
            fs.writeFileSync(path.join(templatesDir, 'task.dita'), '<task id="{{id}}"/>', 'utf8');
            await config().update('templatesPath', templatesDir, vscode.ConfigurationTarget.Global);

            sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: 'Task', value: 'task' } as unknown as vscode.QuickPickItem);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('my-task');
            inputBoxStub.onCall(1).resolves(undefined); // escape the title prompt

            await newTopicCommand();

            assert.strictEqual(fs.existsSync(path.join(workspaceDir, 'my-task.dita')), false, 'no file should be created');
        });

        test('newMapCommand should use a matching template when configured', async () => {
            fs.writeFileSync(
                path.join(templatesDir, 'map.ditamap'),
                '<?xml version="1.0" encoding="UTF-8"?>\n<map id="{{id}}"><title>{{title}}</title></map>\n',
                'utf8'
            );
            await config().update('templatesPath', templatesDir, vscode.ConfigurationTarget.Global);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('my-map');
            inputBoxStub.onCall(1).resolves('My Map Title');

            await newMapCommand();

            const written = fs.readFileSync(path.join(workspaceDir, 'my-map.ditamap'), 'utf8');
            assert.ok(written.includes('id="my-map"'));
            assert.ok(written.includes('<title>My Map Title</title>'));
        });

        test('newBookmapCommand should reuse the already-collected book title, prompting nothing extra', async () => {
            fs.writeFileSync(
                path.join(templatesDir, 'bookmap.bookmap'),
                '<?xml version="1.0" encoding="UTF-8"?>\n<bookmap id="{{id}}"><booktitle><mainbooktitle>{{title}}</mainbooktitle></booktitle></bookmap>\n',
                'utf8'
            );
            await config().update('templatesPath', templatesDir, vscode.ConfigurationTarget.Global);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('My Book'); // book title
            inputBoxStub.onCall(1).resolves('my-book'); // file name

            await newBookmapCommand();

            const written = fs.readFileSync(path.join(workspaceDir, 'my-book.bookmap'), 'utf8');
            assert.ok(written.includes('id="my-book"'));
            assert.ok(written.includes('<mainbooktitle>My Book</mainbooktitle>'));
            assert.strictEqual(inputBoxStub.callCount, 2, 'should not prompt a third time for title');
        });
    });

    suite('Project Init Wizard (orchestration)', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        let sandbox: sinon.SinonSandbox;
        let workspaceDir: string;

        setup(() => {
            sandbox = sinon.createSandbox();
            workspaceDir = fs.mkdtempSync(path.join(fixturesPath, 'temp-ws-'));
            sandbox.stub(vscode.workspace, 'workspaceFolders').value([
                { uri: vscode.Uri.file(workspaceDir), name: 'test-ws', index: 0 }
            ]);
        });

        teardown(async () => {
            sandbox.restore();
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            fs.rmSync(workspaceDir, { recursive: true, force: true });
        });

        test('Should scaffold a map, starter topics, folder layout, and a starter .ditaval', async () => {
            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'Map', value: 'map' } as unknown as vscode.QuickPickItem); // root type
            quickPickStub.onCall(1).resolves([
                { label: 'Concept', value: 'concept' },
                { label: 'Task', value: 'task' }
            ] as unknown as vscode.QuickPickItem); // starter topics
            quickPickStub.onCall(2).resolves({ label: '$(filter) Yes, add a starter .ditaval', value: true } as unknown as vscode.QuickPickItem);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('My Documentation'); // title
            inputBoxStub.onCall(1).resolves('main'); // root file name

            await initProjectCommand();

            assert.ok(fs.existsSync(path.join(workspaceDir, 'maps', 'main.ditamap')), 'root map should be created');
            assert.ok(fs.existsSync(path.join(workspaceDir, 'topics', 'concept.dita')), 'concept starter topic should be created');
            assert.ok(fs.existsSync(path.join(workspaceDir, 'topics', 'task.dita')), 'task starter topic should be created');
            assert.ok(fs.existsSync(path.join(workspaceDir, 'images')), 'images folder should be created');
            assert.ok(fs.existsSync(path.join(workspaceDir, 'maps', 'main.ditaval')), 'starter .ditaval should be created');

            const rootMap = fs.readFileSync(path.join(workspaceDir, 'maps', 'main.ditamap'), 'utf8');
            assert.ok(rootMap.includes('<title>My Documentation</title>'));
            assert.ok(rootMap.includes('href="../topics/concept.dita"'));
            assert.ok(rootMap.includes('href="../topics/task.dita"'));
        });

        test('Should scaffold a bookmap with topicrefs nested directly in a chapter', async () => {
            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'Bookmap', value: 'bookmap' } as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(1).resolves([{ label: 'Task', value: 'task' }] as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(2).resolves({ label: '$(circle-slash) No filter file', value: false } as unknown as vscode.QuickPickItem);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('My Guide');
            inputBoxStub.onCall(1).resolves('guide');

            await initProjectCommand();

            const bookmapPath = path.join(workspaceDir, 'maps', 'guide.bookmap');
            assert.ok(fs.existsSync(bookmapPath));
            const content = fs.readFileSync(bookmapPath, 'utf8');
            assert.ok(content.includes('<mainbooktitle>My Guide</mainbooktitle>'));
            assert.ok(content.includes('<chapter>'));
            assert.ok(content.includes('href="../topics/task.dita"'));
            assert.strictEqual(fs.existsSync(path.join(workspaceDir, 'maps', 'guide.ditaval')), false, 'no ditaval should be created when declined');
        });

        test('Should succeed with zero starter topics when none are selected', async () => {
            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'Map', value: 'map' } as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(1).resolves(undefined); // Escape on the multi-pick == no topics, not cancellation
            quickPickStub.onCall(2).resolves({ label: '$(circle-slash) No filter file', value: false } as unknown as vscode.QuickPickItem);

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('Minimal Project');
            inputBoxStub.onCall(1).resolves('minimal');

            await initProjectCommand();

            const rootMap = fs.readFileSync(path.join(workspaceDir, 'maps', 'minimal.ditamap'), 'utf8');
            assert.ok(rootMap.includes('Add topicref elements here'), 'should include a placeholder comment instead of a topicref');
            assert.strictEqual(fs.existsSync(path.join(workspaceDir, 'topics')), true, 'topics folder should still be created even with no starter topics');
        });

        test('Should abort without writing anything when the root map file already exists', async () => {
            fs.mkdirSync(path.join(workspaceDir, 'maps'), { recursive: true });
            fs.writeFileSync(path.join(workspaceDir, 'maps', 'main.ditamap'), 'existing content', 'utf8');

            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onCall(0).resolves({ label: 'Map', value: 'map' } as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(1).resolves([{ label: 'Concept', value: 'concept' }] as unknown as vscode.QuickPickItem);
            quickPickStub.onCall(2).resolves({ label: '$(circle-slash) No filter file', value: false } as unknown as vscode.QuickPickItem);
            const errorStub = sandbox.stub(vscode.window, 'showErrorMessage');

            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
            inputBoxStub.onCall(0).resolves('My Documentation');
            inputBoxStub.onCall(1).resolves('main');

            await initProjectCommand();

            assert.ok(errorStub.calledOnce, 'should show a conflict error');
            assert.strictEqual(
                fs.readFileSync(path.join(workspaceDir, 'maps', 'main.ditamap'), 'utf8'),
                'existing content',
                'the pre-existing file should be untouched'
            );
            assert.strictEqual(fs.existsSync(path.join(workspaceDir, 'topics', 'concept.dita')), false, 'no other file should have been written either');
        });

        test('Should cancel cleanly when the root type picker is escaped', async () => {
            sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
            const inputBoxStub = sandbox.stub(vscode.window, 'showInputBox');

            await initProjectCommand();

            assert.strictEqual(inputBoxStub.called, false);
            assert.strictEqual(fs.existsSync(path.join(workspaceDir, 'maps')), false);
        });
    });
});
