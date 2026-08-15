/**
 * Extract Topic From Section Command Test Suite (§5.4)
 * Tests the pure detectNewTopicType/slugify/buildExtractedTopicContent
 * helpers directly, plus command registration. Full orchestration
 * (interactive prompts, file creation, editor edit) isn't exercised here —
 * see sectionExtractor.test.ts for the extraction logic's own coverage.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    detectNewTopicType,
    slugify,
    buildExtractedTopicContent
} from '../../commands/extractTopicCommand';

suite('Extract Topic From Section Command Test Suite', () => {
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
        test('Should have extractTopicFromSection command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.extractTopicFromSection'),
                'ditacraft.extractTopicFromSection command should be registered'
            );
        });
    });

    suite('detectNewTopicType', () => {
        test('Should map a <concept> root to "concept"', () => {
            assert.strictEqual(detectNewTopicType('<concept id="t"><title>T</title></concept>'), 'concept');
        });

        test('Should map a <reference> root to "reference"', () => {
            assert.strictEqual(detectNewTopicType('<reference id="t"><title>T</title></reference>'), 'reference');
        });

        test('Should map a <task> root to undefined (unsupported)', () => {
            assert.strictEqual(detectNewTopicType('<task id="t"><title>T</title></task>'), undefined);
        });

        test('Should fall back to "topic" for a generic <topic> root', () => {
            assert.strictEqual(detectNewTopicType('<topic id="t"><title>T</title></topic>'), 'topic');
        });

        test('Should fall back to "topic" for an unrecognized root element', () => {
            assert.strictEqual(detectNewTopicType('<glossentry id="t"><glossterm>T</glossterm></glossentry>'), 'topic');
        });

        test('Should skip the XML declaration and DOCTYPE when finding the root', () => {
            const text = '<?xml version="1.0"?>\n<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">\n<concept id="t"/>';
            assert.strictEqual(detectNewTopicType(text), 'concept');
        });
    });

    suite('slugify', () => {
        test('Should lowercase and hyphenate a title', () => {
            assert.strictEqual(slugify('My New Topic'), 'my-new-topic');
        });

        test('Should collapse multiple non-alphanumeric characters into one hyphen', () => {
            assert.strictEqual(slugify('Foo & Bar!!  Baz'), 'foo-bar-baz');
        });

        test('Should trim leading/trailing hyphens', () => {
            assert.strictEqual(slugify('  --Hello--  '), 'hello');
        });

        test('Should truncate very long titles', () => {
            const longTitle = 'word '.repeat(30);
            assert.ok(slugify(longTitle).length <= 60);
        });
    });

    suite('buildExtractedTopicContent', () => {
        test('Should build a valid concept shell with the extracted title/body', () => {
            const content = buildExtractedTopicContent('concept', 'my-topic', 'My Topic', '<p>Body text.</p>');
            assert.ok(content.includes('<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">'));
            assert.ok(content.includes('<concept id="my-topic">'));
            assert.ok(content.includes('<title>My Topic</title>'));
            assert.ok(content.includes('<conbody>'));
            assert.ok(content.includes('<p>Body text.</p>'));
            assert.ok(content.trim().endsWith('</concept>'));
        });

        test('Should build a valid reference shell', () => {
            const content = buildExtractedTopicContent('reference', 'my-ref', 'My Reference', '<p>Ref content.</p>');
            assert.ok(content.includes('<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">'));
            assert.ok(content.includes('<reference id="my-ref">'));
            assert.ok(content.includes('<refbody>'));
        });

        test('Should build a valid generic topic shell', () => {
            const content = buildExtractedTopicContent('topic', 'my-topic', 'My Topic', '<p>Content.</p>');
            assert.ok(content.includes('<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">'));
            assert.ok(content.includes('<topic id="my-topic">'));
            assert.ok(content.includes('<body>'));
        });

        test('Should escape special characters in the title and id', () => {
            const content = buildExtractedTopicContent('topic', 'id', 'A & B <C>', '<p>x</p>');
            assert.ok(content.includes('<title>A &amp; B &lt;C&gt;</title>'));
        });

        test('Should produce an empty body element when there is no body content', () => {
            const content = buildExtractedTopicContent('topic', 'my-topic', 'My Topic', '');
            assert.ok(content.includes('<body></body>'));
        });
    });
});
