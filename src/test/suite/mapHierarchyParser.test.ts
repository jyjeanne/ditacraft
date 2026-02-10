/**
 * Map Hierarchy Parser Test Suite
 * Tests for the shared map hierarchy parser utility.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import {
    extractAttribute,
    detectMapType,
    parseReferences,
    parseMapHierarchy,
    findAllMapsInWorkspace,
    MapNode
} from '../../utils/mapHierarchyParser';

suite('Map Hierarchy Parser Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suite('extractAttribute', () => {
        test('Should extract double-quoted attribute', () => {
            const result = extractAttribute('href="topic.dita" scope="local"', 'href');
            assert.strictEqual(result, 'topic.dita');
        });

        test('Should extract single-quoted attribute', () => {
            const result = extractAttribute("href='topic.dita'", 'href');
            assert.strictEqual(result, 'topic.dita');
        });

        test('Should return null for missing attribute', () => {
            const result = extractAttribute('href="topic.dita"', 'scope');
            assert.strictEqual(result, null);
        });

        test('Should extract navtitle attribute', () => {
            const result = extractAttribute('href="topic.dita" navtitle="My Title"', 'navtitle');
            assert.strictEqual(result, 'My Title');
        });

        test('Should extract keys attribute', () => {
            const result = extractAttribute('keys="product-name" href="product.dita"', 'keys');
            assert.strictEqual(result, 'product-name');
        });

        test('Should handle attribute with spaces around equals', () => {
            const result = extractAttribute('href = "topic.dita"', 'href');
            assert.strictEqual(result, 'topic.dita');
        });

        test('Should handle empty attribute value', () => {
            const result = extractAttribute('href=""', 'href');
            assert.strictEqual(result, '');
        });

        test('Should not match keyref inside conkeyref', () => {
            const result = extractAttribute('conkeyref="some-key/element-id"', 'keyref');
            assert.strictEqual(result, null);
        });

        test('Should match keyref when conkeyref is also present', () => {
            const result = extractAttribute('conkeyref="other/id" keyref="my-key"', 'keyref');
            assert.strictEqual(result, 'my-key');
        });
    });

    suite('detectMapType', () => {
        test('Should detect bookmap from DOCTYPE', () => {
            const result = detectMapType('<?xml version="1.0"?><!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA BookMap//EN" "bookmap.dtd"><bookmap>');
            assert.strictEqual(result, 'map');
        });

        test('Should detect bookmap from element', () => {
            const result = detectMapType('<bookmap id="test">');
            assert.strictEqual(result, 'map');
        });

        test('Should default to map for regular map content', () => {
            const result = detectMapType('<map id="test"><topicref href="topic.dita"/></map>');
            assert.strictEqual(result, 'map');
        });
    });

    suite('parseReferences', () => {
        test('Should parse topicref elements', async () => {
            const content = '<topicref href="topic1.dita"/><topicref href="topic2.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 2);
            assert.strictEqual(nodes[0].type, 'topicref');
            assert.strictEqual(nodes[0].href, 'topic1.dita');
            assert.strictEqual(nodes[1].href, 'topic2.dita');
        });

        test('Should parse chapter elements', async () => {
            const content = '<chapter href="chapter1.dita" navtitle="First Chapter"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 1);
            assert.strictEqual(nodes[0].type, 'chapter');
            assert.strictEqual(nodes[0].label, 'First Chapter');
        });

        test('Should parse keydef elements', async () => {
            const content = '<keydef keys="product-name" href="product.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 1);
            assert.strictEqual(nodes[0].type, 'keydef');
            assert.strictEqual(nodes[0].keys, 'product-name');
        });

        test('Should parse appendix elements', async () => {
            const content = '<appendix href="appendix-a.dita" navtitle="Appendix A"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 1);
            assert.strictEqual(nodes[0].type, 'appendix');
        });

        test('Should parse part elements', async () => {
            const content = '<part href="part1.dita" navtitle="Part I"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 1);
            assert.strictEqual(nodes[0].type, 'part');
        });

        test('Should use navtitle as label when present', async () => {
            const content = '<topicref href="topic.dita" navtitle="My Topic"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].label, 'My Topic');
        });

        test('Should use keys as label when no navtitle', async () => {
            const content = '<keydef keys="my-key"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].label, 'my-key');
        });

        test('Should use keyref as label when no navtitle or keys', async () => {
            const content = '<topicref keyref="plugin-extension-points"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].label, 'plugin-extension-points');
            assert.strictEqual(nodes[0].keyref, 'plugin-extension-points');
        });

        test('Should prefer navtitle over keyref', async () => {
            const content = '<topicref keyref="my-key" navtitle="My Title"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].label, 'My Title');
            assert.strictEqual(nodes[0].keyref, 'my-key');
        });

        test('Should use filename as label when no navtitle, keys, or keyref', async () => {
            const content = '<topicref href="some-topic.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].label, 'some-topic.dita');
        });

        test('Should mark missing files as not existing', async () => {
            const content = '<topicref href="nonexistent-topic.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].exists, false);
        });

        test('Should mark existing files as existing', async () => {
            const content = '<topicref href="valid-topic.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes[0].exists, true);
        });

        test('Should detect circular references', async () => {
            const mapPath = path.join(fixturesPath, 'circular-ref-a.ditamap');
            const visited = new Set<string>([mapPath]);
            const content = `<mapref href="circular-ref-a.ditamap"/>`;
            const nodes = await parseReferences(content, fixturesPath, visited);
            assert.strictEqual(nodes.length, 1);
            assert.ok(nodes[0].label.includes('circular ref'));
            assert.strictEqual(nodes[0].hasErrors, true);
        });

        test('Should return empty array for content with no references', async () => {
            const content = '<title>Just a title</title><p>Some text</p>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 0);
        });
    });

    suite('parseMapHierarchy', () => {
        test('Should parse a valid ditamap file', async () => {
            const mapFile = path.join(fixturesPath, 'valid-map.ditamap');
            const root = await parseMapHierarchy(mapFile);
            assert.strictEqual(root.type, 'map');
            assert.strictEqual(root.exists, true);
            assert.strictEqual(root.id, 'root');
            assert.ok(root.children.length > 0, 'Should have children');
        });

        test('Should parse root-map-with-keys', async () => {
            const mapFile = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const root = await parseMapHierarchy(mapFile);
            assert.strictEqual(root.type, 'map');

            // Should contain keydefs and topicrefs
            const keydefs = root.children.filter((c: MapNode) => c.type === 'keydef');
            const topicrefs = root.children.filter((c: MapNode) => c.type === 'topicref');
            assert.ok(keydefs.length > 0, 'Should have keydef children');
            assert.ok(topicrefs.length > 0, 'Should have topicref children');
        });

        test('Should set root label to filename', async () => {
            const mapFile = path.join(fixturesPath, 'valid-map.ditamap');
            const root = await parseMapHierarchy(mapFile);
            assert.strictEqual(root.label, 'valid-map.ditamap');
        });

        test('Should throw for non-existent file', async () => {
            const mapFile = path.join(fixturesPath, 'nonexistent.ditamap');
            await assert.rejects(
                () => parseMapHierarchy(mapFile),
                /ENOENT/
            );
        });
    });

    suite('findAllMapsInWorkspace', () => {
        const hasWorkspace = () => vscode.workspace.workspaceFolders !== undefined
            && vscode.workspace.workspaceFolders.length > 0;

        test('Should return array of map file paths', async () => {
            const maps = await findAllMapsInWorkspace();
            assert.ok(Array.isArray(maps));
        });

        test('Should find ditamap and bookmap files when workspace is open', async function () {
            if (!hasWorkspace()) { this.skip(); return; }
            const maps = await findAllMapsInWorkspace();
            assert.ok(maps.length > 0, 'Should find at least one map file');
            const hasDitamap = maps.some(m => m.endsWith('.ditamap'));
            assert.ok(hasDitamap, 'Should find at least one .ditamap file');
        });

        test('Should return sorted paths', async () => {
            const maps = await findAllMapsInWorkspace();
            if (maps.length > 1) {
                for (let i = 1; i < maps.length; i++) {
                    assert.ok(
                        maps[i - 1].localeCompare(maps[i]) <= 0,
                        'Paths should be sorted'
                    );
                }
            }
        });

        test('Should return empty array when no workspace is open', async function () {
            if (hasWorkspace()) { this.skip(); return; }
            const maps = await findAllMapsInWorkspace();
            assert.strictEqual(maps.length, 0);
        });
    });

    suite('parseReferences comment stripping', () => {
        test('Should ignore elements inside XML comments', async () => {
            const content = '<!-- <topicref href="commented-out.dita"/> --><topicref href="real.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 1);
            assert.strictEqual(nodes[0].href, 'real.dita');
        });

        test('Should preserve document order with mixed element types', async () => {
            const content = '<chapter href="ch1.dita"/><topicref href="t1.dita"/><appendix href="a1.dita"/>';
            const nodes = await parseReferences(content, fixturesPath, new Set());
            assert.strictEqual(nodes.length, 3);
            assert.strictEqual(nodes[0].type, 'chapter');
            assert.strictEqual(nodes[1].type, 'topicref');
            assert.strictEqual(nodes[2].type, 'appendix');
        });
    });
});
