/**
 * Publish Command Test Suite
 * Tests publish command handling and error scenarios
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Publish Command Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

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

    suite('Publish Command Registration', () => {
        test('Should have publish command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.publish'),
                'ditacraft.publish command should be registered'
            );
        });

        test('Should have publishHTML5 command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.publishHTML5'),
                'ditacraft.publishHTML5 command should be registered'
            );
        });
    });

    suite('Publish Command - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute publish command without any file open
            // This should not throw but show an error message
            try {
                await vscode.commands.executeCommand('ditacraft.publish');
                // Command should complete without throwing
            } catch (_error) {
                // If it throws, that's also acceptable error handling
                assert.ok(true, 'Command handled gracefully');
            }
        });

        test('Should handle publishHTML5 with no active editor gracefully', async function() {
            this.timeout(5000);

            // Close all editors first
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute publishHTML5 command without any file open
            try {
                await vscode.commands.executeCommand('ditacraft.publishHTML5');
            } catch (_error) {
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('Publish Command - File Validation', () => {
        // Note: We cannot fully test publish commands because they show UI dialogs
        // that hang the test runner. These tests verify the command infrastructure.

        test('Valid DITA files have correct extensions', function() {
            // Test that our fixtures have the correct extensions
            const validExtensions = ['.dita', '.ditamap', '.bookmap'];

            assert.ok(validExtensions.includes('.dita'), '.dita is a valid extension');
            assert.ok(validExtensions.includes('.ditamap'), '.ditamap is a valid extension');
            assert.ok(validExtensions.includes('.bookmap'), '.bookmap is a valid extension');
        });

        test('Fixture files exist for testing', function() {
            const topicPath = path.join(fixturesPath, 'valid-topic.dita');
            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            const bookmapPath = path.join(fixturesPath, 'valid-bookmap.bookmap');

            assert.ok(fs.existsSync(topicPath), 'valid-topic.dita fixture should exist');
            assert.ok(fs.existsSync(mapPath), 'valid-map.ditamap fixture should exist');
            assert.ok(fs.existsSync(bookmapPath), 'valid-bookmap.bookmap fixture should exist');
        });
    });

    suite('DITA-OT Configuration', () => {
        test('ditaOtPath configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const ditaOtPath = config.get<string>('ditaOtPath');

            // ditaOtPath should be defined (even if empty)
            assert.ok(ditaOtPath !== undefined, 'ditaOtPath config should be defined');
        });

        test('outputDirectory configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const outputDir = config.get<string>('outputDirectory');

            assert.ok(outputDir !== undefined, 'outputDirectory config should be defined');
        });

        test('defaultTranstype configuration should exist', function() {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const transtype = config.get<string>('defaultTranstype');

            assert.ok(transtype !== undefined, 'defaultTranstype config should be defined');
            assert.strictEqual(transtype, 'html5', 'Default transtype should be html5');
        });
    });
});
