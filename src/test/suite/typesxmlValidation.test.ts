/**
 * TypesXML Validation Test Suite
 * Tests for DITA DTD validation using TypesXML
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { TypesXMLValidator, isTypesXMLAvailable } from '../../providers/typesxmlValidator';

suite('TypesXML Validation Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let extensionPath: string;

    suiteSetup(async () => {
        // Get extension path
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension) {
            if (!extension.isActive) {
                await extension.activate();
            }
            extensionPath = extension.exports?.context?.extensionPath ||
                path.join(__dirname, '..', '..', '..');
        } else {
            extensionPath = path.join(__dirname, '..', '..', '..');
        }
    });

    suite('TypesXML Availability', () => {
        test('TypesXML should be available', () => {
            const available = isTypesXMLAvailable();
            assert.strictEqual(available, true, 'TypesXML should be available');
        });

        test('TypesXMLValidator should initialize successfully', () => {
            const validator = new TypesXMLValidator(extensionPath);
            assert.strictEqual(validator.isAvailable, true, 'Validator should be available');
            assert.strictEqual(validator.loadError, null, 'No load error expected');
            validator.dispose();
        });
    });

    suite('DTD Validation - Valid Documents', () => {
        let validator: TypesXMLValidator;

        suiteSetup(() => {
            validator = new TypesXMLValidator(extensionPath);
        });

        suiteTeardown(() => {
            validator.dispose();
        });

        test('Should validate valid DITA concept', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.3 Concept//EN" "concept.dtd">
<concept id="test_concept">
    <title>Test Concept</title>
    <conbody>
        <p>This is a valid paragraph.</p>
    </conbody>
</concept>`;

            const result = validator.validate(content);

            console.log('Valid concept validation result:');
            console.log('- valid:', result.valid);
            console.log('- errors:', result.errors.length);

            assert.strictEqual(result.valid, true, 'Valid concept should pass validation');
            assert.strictEqual(result.errors.length, 0, 'No errors expected');
        });

        test('Should validate valid DITA topic', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">
<topic id="test_topic">
    <title>Test Topic</title>
    <body>
        <p>This is a valid paragraph.</p>
        <ul>
            <li>List item 1</li>
            <li>List item 2</li>
        </ul>
    </body>
</topic>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, true, 'Valid topic should pass validation');
            assert.strictEqual(result.errors.length, 0, 'No errors expected');
        });

        test('Should validate valid DITA map', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <topicref href="topic.dita"/>
</map>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, true, 'Valid map should pass validation');
            assert.strictEqual(result.errors.length, 0, 'No errors expected');
        });

        test('Should validate valid DITA task', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA 1.3 Task//EN" "task.dtd">
<task id="test_task">
    <title>Test Task</title>
    <taskbody>
        <steps>
            <step>
                <cmd>Do something</cmd>
            </step>
        </steps>
    </taskbody>
</task>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, true, 'Valid task should pass validation');
            assert.strictEqual(result.errors.length, 0, 'No errors expected');
        });

        test('Should validate valid DITA reference', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA 1.3 Reference//EN" "reference.dtd">
<reference id="test_ref">
    <title>Test Reference</title>
    <refbody>
        <section>
            <title>Section Title</title>
            <p>Section content</p>
        </section>
    </refbody>
</reference>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, true, 'Valid reference should pass validation');
            assert.strictEqual(result.errors.length, 0, 'No errors expected');
        });
    });

    suite('DTD Validation - Invalid Documents', () => {
        let validator: TypesXMLValidator;

        suiteSetup(() => {
            validator = new TypesXMLValidator(extensionPath);
        });

        suiteTeardown(() => {
            validator.dispose();
        });

        test('Should detect <p> element inside <map>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <p>Invalid paragraph in map</p>
</map>`;

            const result = validator.validate(content);

            console.log('Invalid map (<p> in map) validation result:');
            console.log('- valid:', result.valid);
            console.log('- errors:', JSON.stringify(result.errors, null, 2));

            assert.strictEqual(result.valid, false, 'Map with <p> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
            assert.ok(
                result.errors.some(e => e.message.toLowerCase().includes('map') ||
                    e.message.toLowerCase().includes('invalid')),
                'Error should mention invalid element'
            );
        });

        test('Should detect <ul> element inside <map>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA 1.3 Map//EN" "map.dtd">
<map>
    <title>Test Map</title>
    <ul><li>Invalid list</li></ul>
</map>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, false, 'Map with <ul> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });

        test('Should detect <topicref> inside <concept>', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.3 Concept//EN" "concept.dtd">
<concept id="test">
    <title>Test Concept</title>
    <topicref href="topic.dita"/>
</concept>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, false, 'Concept with <topicref> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });

        test('Should detect wrong body type in concept', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.3 Concept//EN" "concept.dtd">
<concept id="test">
    <title>Test Concept</title>
    <body><p>Wrong body type - should use conbody</p></body>
</concept>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, false, 'Concept with <body> instead of <conbody> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });

        test('Should detect missing required id attribute on topic', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">
<topic>
    <title>Test Topic</title>
    <body><p>Content</p></body>
</topic>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, false, 'Topic without id should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });

        test('Should detect malformed XML', () => {
            const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">
<topic id="test">
    <title>Unclosed title
    <body><p>Content</p></body>
</topic>`;

            const result = validator.validate(content);

            assert.strictEqual(result.valid, false, 'Malformed XML should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');
        });
    });

    suite('Integration with DitaValidator', () => {
        test('Should have valid validation engine configured', async function() {
            this.timeout(5000);

            // Get configuration
            const config = vscode.workspace.getConfiguration('ditacraft');
            const engine = config.get<string>('validationEngine');

            console.log('Current validation engine:', engine);

            // Validation engine should be one of the valid options
            const validEngines = ['typesxml', 'built-in', 'xmllint'];
            assert.ok(
                validEngines.includes(engine || ''),
                `Validation engine should be one of: ${validEngines.join(', ')}`
            );
        });

        test('Should validate fixture file with TypesXML', async function() {
            this.timeout(5000);

            const validator = new TypesXMLValidator(extensionPath);

            if (!validator.isAvailable) {
                this.skip();
                return;
            }

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'invalid-p-in-map.ditamap'));
            const result = validator.validateFile(fileUri.fsPath);

            console.log('Fixture file validation result:');
            console.log('- valid:', result.valid);
            console.log('- errors:', result.errors.length);

            assert.strictEqual(result.valid, false, 'File with <p> in <map> should be invalid');
            assert.ok(result.errors.length > 0, 'Should have at least one error');

            validator.dispose();
        });
    });
});
