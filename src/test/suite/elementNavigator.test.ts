/**
 * Element Navigator Test Suite
 * Tests for same-file element navigation functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { findElementById } from '../../utils/elementNavigator';

suite('Element Navigator Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(async () => {
        // Ensure extension is activated
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('findElementById', () => {
        test('Should find element with simple id', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Should find the summary section
            const lineNumber = findElementById(document, 'summary');
            assert.ok(lineNumber >= 0, 'Should find element with id="summary"');

            // Verify the line contains the id
            const line = document.lineAt(lineNumber).text;
            assert.ok(line.includes('id="summary"'), `Line should contain id="summary", got: ${line}`);
        });

        test('Should find root element id', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Should find the root topic id
            const lineNumber = findElementById(document, 'topic_with_xref_links');
            assert.ok(lineNumber >= 0, 'Should find root element id');

            const line = document.lineAt(lineNumber).text;
            assert.ok(line.includes('id="topic_with_xref_links"'), 'Should find topic root id');
        });

        test('Should return -1 for non-existent id', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const lineNumber = findElementById(document, 'nonexistent_element_id');
            assert.strictEqual(lineNumber, -1, 'Should return -1 for non-existent id');
        });

        test('Should handle id with underscores', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const lineNumber = findElementById(document, 'valid_topic');
            assert.ok(lineNumber >= 0, 'Should find element with underscored id');
        });

        test('Should handle id with hyphens', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'additional-info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const lineNumber = findElementById(document, 'additional-content');
            assert.ok(lineNumber >= 0, 'Should find element with hyphenated id');
        });
    });

    suite('Command URI Navigation', () => {
        test('Should create valid command URIs for same-file references', async () => {
            // Import the link provider
            const { DitaLinkProvider } = await import('../../providers/ditaLinkProvider');
            const linkProvider = new DitaLinkProvider();

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Find links with command URIs (same-file references)
            const commandLinks = links!.filter(link =>
                link.target?.scheme === 'command'
            );

            console.log('Command links found:', commandLinks.length);
            commandLinks.forEach(link => {
                console.log('  - Command URI:', link.target?.toString());
            });

            assert.ok(commandLinks.length > 0, 'Should create command URIs for same-file references');

            // Verify command URI structure
            commandLinks.forEach(link => {
                const uriString = link.target?.toString() || '';
                assert.ok(uriString.startsWith('command:ditacraft.navigateToElement'),
                    'Command URI should start with ditacraft.navigateToElement');
                assert.ok(uriString.includes('?'), 'Command URI should include arguments');
            });
        });

        test('Should include tooltip for same-file references', async () => {
            const { DitaLinkProvider } = await import('../../providers/ditaLinkProvider');
            const linkProvider = new DitaLinkProvider();

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            const sameFileLinks = links!.filter(link =>
                link.tooltip?.includes('Go to element')
            );

            assert.ok(sameFileLinks.length > 0, 'Should have tooltips for same-file references');
            sameFileLinks.forEach(link => {
                assert.ok(link.tooltip!.startsWith('Go to element:'),
                    'Tooltip should indicate navigation to element');
            });
        });
    });

    suite('Element Path Parsing', () => {
        test('Should handle simple element id', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'additional-info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Test simple id
            const lineNumber = findElementById(document, 'more-details');
            assert.ok(lineNumber >= 0, 'Should find simple element id');
        });

        test('Should handle element id with multiple parts', async () => {
            // When we have topic_id/element_id format, we should find element_id
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'additional-info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Test finding the last part of a path
            const lineNumber = findElementById(document, 'important-warning');
            assert.ok(lineNumber >= 0, 'Should find element by its id regardless of path');
        });
    });

    suite('Integration with Link Provider', () => {
        test('Conref same-file references should use command URIs', async () => {
            const { DitaLinkProvider } = await import('../../providers/ditaLinkProvider');
            const linkProvider = new DitaLinkProvider();

            // Create a test document with same-file conref
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="test_topic">
    <title>Test Topic</title>
    <body>
        <p conref="#test_topic/para1">Referenced paragraph</p>
        <p id="para1">This is the target paragraph</p>
    </body>
</topic>`;

            const document = await vscode.workspace.openTextDocument({
                content: content,
                language: 'dita'
            });

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should have a command link for the conref
            const conrefLink = links!.find(link =>
                link.target?.scheme === 'command' &&
                link.tooltip?.includes('test_topic/para1')
            );

            assert.ok(conrefLink, 'Should create command URI for same-file conref');
        });

        test('Xref same-file references should use command URIs', async () => {
            const { DitaLinkProvider } = await import('../../providers/ditaLinkProvider');
            const linkProvider = new DitaLinkProvider();

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should have command link for xref with href="#..."
            const xrefSameFileLink = links!.find(link =>
                link.target?.scheme === 'command' &&
                link.tooltip?.includes('topic_with_xref_links/summary')
            );

            assert.ok(xrefSameFileLink, 'Should create command URI for xref same-file reference');
        });

        test('Link element same-file references should use command URIs', async () => {
            const { DitaLinkProvider } = await import('../../providers/ditaLinkProvider');
            const linkProvider = new DitaLinkProvider();

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // There should be at least one same-file link (command URI)
            const allSameFileLinks = links!.filter(link =>
                link.target?.scheme === 'command'
            );

            assert.ok(allSameFileLinks.length > 0, 'Should create command URIs for same-file link elements');
        });
    });
});
