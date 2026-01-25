/**
 * Content Model Validation Test Suite
 * Tests for DITA element content model validation
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { validateDitaContentModel, getContentModel, isMapElement, isTopicElement } from '../../providers/ditaContentModelValidator';
import { DitaValidator } from '../../providers/ditaValidator';

suite('Content Model Validation Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suite('Unit Tests - validateDitaContentModel', () => {
        test('Should detect <p> element inside <map>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <p>Invalid paragraph in map</p>
</map>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <p> in <map>');
            const pError = result.errors.find(e => e.message.includes('<p>') && e.message.includes('<map>'));
            assert.ok(pError, 'Error should mention <p> and <map>');
        });

        test('Should detect <ul> element inside <map>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <ul><li>Invalid list</li></ul>
</map>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <ul> in <map>');
        });

        test('Should detect <section> element inside <map>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <section><title>Invalid Section</title></section>
</map>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <section> in <map>');
        });

        test('Should accept valid map structure', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Valid Map</title>
    <topicmeta>
        <navtitle>Navigation Title</navtitle>
    </topicmeta>
    <topicref href="topic1.dita">
        <topicref href="topic2.dita"/>
    </topicref>
    <reltable>
        <relrow>
            <relcell><topicref href="topic3.dita"/></relcell>
        </relrow>
    </reltable>
</map>`;

            const result = validateDitaContentModel(content);

            // Should have no errors for disallowed children
            const contentModelErrors = result.errors.filter(e => e.source === 'content-model');
            assert.strictEqual(contentModelErrors.length, 0, 'Valid map should have no content model errors');
        });

        test('Should detect <p> element inside <topicref>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <topicref href="topic.dita">
        <p>Invalid paragraph in topicref</p>
    </topicref>
</map>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <p> in <topicref>');
        });

        test('Should detect <topicref> inside <concept>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.3 Concept//EN" "concept.dtd">
<concept id="test">
    <title>Test Concept</title>
    <topicref href="topic.dita"/>
</concept>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <topicref> in <concept>');
        });

        // Note: Tests for missing id/title are in dtdValidation.test.ts
        // The content model validator focuses on element nesting rules
        // Required attributes/children are validated by ditaValidator.validateDitaStructure

        test('Should detect wrong body type in concept', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.3 Concept//EN" "concept.dtd">
<concept id="test">
    <title>Test Concept</title>
    <body><p>Wrong body type - should use conbody</p></body>
</concept>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect <body> in concept');
            const bodyError = result.errors.find(e => e.message.includes('<body>'));
            assert.ok(bodyError, 'Error should mention <body> element');
        });

        test('Should detect wrong body type in task', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA 1.3 Task//EN" "task.dtd">
<task id="test">
    <title>Test Task</title>
    <conbody><p>Wrong body type - should use taskbody</p></conbody>
</task>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect <conbody> in task');
            const bodyError = result.errors.find(e => e.message.includes('<conbody>'));
            assert.ok(bodyError, 'Error should mention <conbody> element');
        });

        test('Should accept valid topic structure', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">
<topic id="test_topic">
    <title>Valid Topic</title>
    <shortdesc>A short description</shortdesc>
    <body>
        <p>This is a valid paragraph.</p>
        <ul>
            <li>List item 1</li>
            <li>List item 2</li>
        </ul>
        <section>
            <title>Section Title</title>
            <p>Section content.</p>
        </section>
    </body>
</topic>`;

            const result = validateDitaContentModel(content);

            // Filter only content-model errors (not warnings)
            const contentModelErrors = result.errors.filter(e => e.source === 'content-model');
            assert.strictEqual(contentModelErrors.length, 0, 'Valid topic should have no content model errors');
        });

        test('Should detect <p> inside <topicmeta>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <topicmeta>
        <p>Invalid paragraph in metadata</p>
    </topicmeta>
</map>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <p> in <topicmeta>');
        });

        test('Should detect <p> inside <bookmap>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA 1.3 BookMap//EN" "bookmap.dtd">
<bookmap>
    <booktitle><mainbooktitle>Test Book</mainbooktitle></booktitle>
    <p>Invalid paragraph in bookmap</p>
</bookmap>`;

            const result = validateDitaContentModel(content);

            assert.ok(result.errors.length > 0, 'Should detect invalid <p> in <bookmap>');
        });
    });

    suite('Unit Tests - Helper Functions', () => {
        test('isMapElement should identify map elements', () => {
            assert.strictEqual(isMapElement('map'), true);
            assert.strictEqual(isMapElement('bookmap'), true);
            assert.strictEqual(isMapElement('topic'), false);
            assert.strictEqual(isMapElement('concept'), false);
        });

        test('isTopicElement should identify topic elements', () => {
            assert.strictEqual(isTopicElement('topic'), true);
            assert.strictEqual(isTopicElement('concept'), true);
            assert.strictEqual(isTopicElement('task'), true);
            assert.strictEqual(isTopicElement('reference'), true);
            assert.strictEqual(isTopicElement('map'), false);
        });

        test('getContentModel should return content model for known elements', () => {
            const mapModel = getContentModel('map');
            assert.ok(mapModel, 'Should have content model for map');
            assert.ok(mapModel?.disallowedChildren?.includes('p'), 'Map should disallow <p>');

            const topicModel = getContentModel('topic');
            assert.ok(topicModel, 'Should have content model for topic');
            assert.ok(topicModel?.disallowedChildren?.includes('topicref'), 'Topic should disallow <topicref>');
            // Note: requiredAttributes (id) are validated by ditaValidator.validateDitaStructure
        });

        test('getContentModel should return undefined for unknown elements', () => {
            const model = getContentModel('unknownelement');
            assert.strictEqual(model, undefined);
        });
    });

    suite('Integration Tests - DitaValidator with Content Model', () => {
        let validator: DitaValidator;
        let extensionContext: vscode.ExtensionContext;

        suiteSetup(async () => {
            // Get extension context
            const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
            if (extension) {
                if (!extension.isActive) {
                    await extension.activate();
                }
                extensionContext = extension.exports?.context || {
                    extensionPath: path.join(__dirname, '..', '..', '..')
                } as vscode.ExtensionContext;
            } else {
                extensionContext = {
                    extensionPath: path.join(__dirname, '..', '..', '..')
                } as vscode.ExtensionContext;
            }

            validator = new DitaValidator(extensionContext);
        });

        suiteTeardown(() => {
            validator.dispose();
        });

        test('Should detect <p> in map via full validation', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-p-in-map.ditamap'));
            const result = await validator.validateFile(fileUri);

            console.log('Validation result for <p> in map:');
            console.log('- valid:', result.valid);
            console.log('- errors:', JSON.stringify(result.errors, null, 2));

            assert.strictEqual(result.valid, false, 'Map with <p> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');

            const pError = result.errors.find(e =>
                e.message.toLowerCase().includes('<p>') ||
                e.message.toLowerCase().includes('paragraph')
            );
            assert.ok(pError, 'Should have error about <p> element');
        });

        test('Should validate valid map without content model errors', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));
            const result = await validator.validateFile(fileUri);

            console.log('Validation result for valid map:');
            console.log('- valid:', result.valid);
            console.log('- errors:', result.errors.length);

            // Should have minimal errors (possibly warnings about missing elements)
            const contentModelErrors = result.errors.filter(e => e.source === 'content-model');
            assert.strictEqual(contentModelErrors.length, 0, 'Valid map should have no content model errors');
        });
    });
});
