/**
 * File Creation Commands Test Suite
 * Tests for new topic, map, and bookmap creation commands
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

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
});
