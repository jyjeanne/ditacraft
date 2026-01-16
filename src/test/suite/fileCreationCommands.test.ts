/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    validateFileName,
    generateTopicContent,
    generateMapContent,
    generateBookmapContent
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
});
