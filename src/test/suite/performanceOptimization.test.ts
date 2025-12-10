/**
 * Performance Optimization Tests
 * Tests for link provider performance improvements
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { DitaLinkProvider } from '../../providers/ditaLinkProvider';
import { getGlobalKeySpaceResolver } from '../../providers/ditaLinkProvider';

suite('Performance Optimization Tests', () => {
    let linkProvider: DitaLinkProvider;
    let tempDir: string;

    setup(async () => {
        // Initialize link provider
        const keySpaceResolver = getGlobalKeySpaceResolver();
        linkProvider = new DitaLinkProvider(keySpaceResolver);

        // Create a temp directory for test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
    });

    teardown(() => {
        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('Link provider should handle large files efficiently', async function() {
        this.timeout(10000); // Allow up to 10 seconds

        // Create a large test file with many links
        const largeFilePath = path.join(tempDir, 'large-map.ditamap');

        // Create content with many topicref elements
        const topicRefs = [];
        for (let i = 0; i < 1000; i++) {
            topicRefs.push(`<topicref href="topic${i}.dita">`);
        }

        const largeContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <title>Large Map Test</title>
    ${topicRefs.join('\n    ')}
</map>`;

        fs.writeFileSync(largeFilePath, largeContent);

        // Open the document
        const document = await vscode.workspace.openTextDocument(largeFilePath);

        // Measure performance
        const startTime = Date.now();
        const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);
        const endTime = Date.now();

        // Should complete within reasonable time
        assert.ok((endTime - startTime) < 5000, `Link processing took ${endTime - startTime}ms, should complete within 5 seconds`);

        // Should find all links
        assert.ok(links.length >= 900, `Found ${links.length} links, should find at least 900`);
    });

    test('Link provider should handle very large files with chunked processing', async function() {
        this.timeout(30000); // Allow up to 30 seconds

        // Create a very large test file
        const veryLargeFilePath = path.join(tempDir, 'very-large-map.ditamap');

        // Create content with many topicref elements
        const topicRefs = [];
        for (let i = 0; i < 10000; i++) {
            topicRefs.push(`<topicref href="topic${i}.dita" format="dita" scope="local"/>`);
        }

        const veryLargeContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <title>Very Large Map Test</title>
    ${topicRefs.join('\n    ')}
</map>`;

        fs.writeFileSync(veryLargeFilePath, veryLargeContent);

        // Open the document
        const document = await vscode.workspace.openTextDocument(veryLargeFilePath);

        // Measure performance
        const startTime = Date.now();
        const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);
        const endTime = Date.now();

        // Should complete within reasonable time even for large files
        assert.ok((endTime - startTime) < 20000, `Link processing took ${endTime - startTime}ms, should complete within 20 seconds`);

        // Should find most links (respecting maxLinkMatches setting)
        assert.ok(links.length >= 5000, `Found ${links.length} links, should find at least 5000`);
    });

    test('Link provider should not crash on malformed XML', async function() {
        this.timeout(5000);

        const malformedFilePath = path.join(tempDir, 'malformed-map.ditamap');
        const malformedContent = `<?xml version="1.0" encoding="UTF-8"?>
<map>
    <title>Malformed Map Test</title>
    <topicref href="topic1.dita"/>
    <topicref href="topic2.dita"
    <topicref href="topic3.dita"/>
</map>`;

        fs.writeFileSync(malformedFilePath, malformedContent);

        // Open the document
        const document = await vscode.workspace.openTextDocument(malformedFilePath);

        // Should not crash
        const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

        // Should still find some valid links
        assert.ok(links.length >= 1, `Found ${links.length} links, should find at least 1 valid link`);
    });
});
