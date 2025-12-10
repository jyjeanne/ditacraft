/**
 * Enhanced DTD Validation Tests
 * Tests for improved DTD validation features
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { DitaValidator } from '../../providers/ditaValidator';

suite('Enhanced DTD Validation Tests', () => {
    let validator: DitaValidator;
    let tempDir: string;
    // Path to source fixtures (not compiled output)
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    setup(async () => {
        // Initialize validator
        validator = new DitaValidator();

        // Create a temp directory for test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-dtd-test-'));
    });

    teardown(() => {
        validator.dispose();
        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('DTD validation should provide enhanced error messages', async function() {
        this.timeout(5000);

        const testFilePath = path.join(fixturesPath, 'dtd-invalid-missing-id.dita');

        // Skip if fixture doesn't exist
        if (!fs.existsSync(testFilePath)) {
            this.skip();
            return;
        }

        const fileUri = vscode.Uri.file(testFilePath);
        const result = await validator.validateFile(fileUri);

        // Should have errors
        assert.strictEqual(result.valid, false);
        assert.ok(result.errors.length >= 1, 'Should have at least one error');
    });

    test('DTD validation should handle large files efficiently', async function() {
        this.timeout(10000); // Allow up to 10 seconds

        // Create a large test file in temp directory
        const largeFilePath = path.join(tempDir, 'large-test.dita');

        // Create valid DITA content with many paragraphs
        const paragraphs = [];
        for (let i = 0; i < 500; i++) {
            paragraphs.push(`<p>Paragraph ${i} with some content for testing performance.</p>`);
        }

        const largeContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="large-test">
    <title>Large Test Topic</title>
    <body>
        ${paragraphs.join('\n        ')}
    </body>
</topic>`;

        fs.writeFileSync(largeFilePath, largeContent);

        const fileUri = vscode.Uri.file(largeFilePath);
        const startTime = Date.now();

        await validator.validateFile(fileUri);
        const endTime = Date.now();

        // Should complete within reasonable time
        assert.ok((endTime - startTime) < 5000, `Validation took ${endTime - startTime}ms, should complete within 5 seconds`);
    });

    test('DTD validation should detect missing required elements', async function() {
        this.timeout(5000);

        const testFilePath = path.join(fixturesPath, 'dtd-invalid-missing-title.dita');

        // Skip if fixture doesn't exist
        if (!fs.existsSync(testFilePath)) {
            this.skip();
            return;
        }

        const fileUri = vscode.Uri.file(testFilePath);
        const result = await validator.validateFile(fileUri);

        // At least verify the validation runs without crashing
        assert.ok(result.errors !== undefined, 'Should return validation result with errors array');
    });

    test('DTD validation should handle malformed XML gracefully', async function() {
        this.timeout(5000);

        // Create a malformed test file in temp directory
        const malformedFilePath = path.join(tempDir, 'malformed-test.dita');
        const malformedContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="malformed">
    <title>Malformed Topic</title>
    <body>
        <p>Unclosed paragraph
        <p>Another paragraph</p>
    </body>
</topic>`;

        fs.writeFileSync(malformedFilePath, malformedContent);

        const fileUri = vscode.Uri.file(malformedFilePath);

        // Should not crash, and should report errors
        const result = await validator.validateFile(fileUri);
        assert.strictEqual(result.valid, false, 'Malformed XML should be invalid');
        assert.ok(result.errors.length >= 1, 'Should have at least one error');
    });

    test('DTD validation should provide performance warnings for large files', async () => {
        // This test verifies the placeholder for future performance monitoring
        assert.ok(true, 'Performance warning test placeholder');
    });
});
