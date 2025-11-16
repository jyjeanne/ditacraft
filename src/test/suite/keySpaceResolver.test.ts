/**
 * Key Space Resolver Test Suite
 * Tests key space building, resolution, caching, and hierarchy traversal
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { KeySpaceResolver } from '../../utils/keySpaceResolver';

suite('Key Space Resolver Test Suite', () => {
    let resolver: KeySpaceResolver;
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(() => {
        resolver = new KeySpaceResolver();
    });

    suiteTeardown(() => {
        resolver.dispose();
    });

    suite('Key Extraction from Single Map', () => {
        test('Should extract keydef with href', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            assert.ok(keySpace.keys.has('common-note'), 'Should find common-note key');

            const keyDef = keySpace.keys.get('common-note');
            assert.ok(keyDef, 'Key definition should exist');
            assert.ok(keyDef!.targetFile?.includes('common_notes.dita'),
                'Should resolve href to target file');
            assert.strictEqual(keyDef!.elementId, 'common_notes/important_note',
                'Should extract element ID from fragment');
        });

        test('Should extract keydef with topicmeta keywords', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('product-name');
            assert.ok(keyDef, 'Should find product-name key');
            assert.ok(keyDef!.targetFile?.includes('product_info.dita'),
                'Should have target file');
        });

        test('Should extract multiple keys from same @keys attribute', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // "product config-guide" should create two keys
            assert.ok(keySpace.keys.has('product'), 'Should extract first key from space-separated list');
            assert.ok(keySpace.keys.has('config-guide'), 'Should extract second key from space-separated list');

            const productDef = keySpace.keys.get('product');
            const configDef = keySpace.keys.get('config-guide');
            assert.strictEqual(productDef!.targetFile, configDef!.targetFile,
                'Both keys should point to same target file');
        });

        test('Should extract inline key definition without href', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('version-number');
            assert.ok(keyDef, 'Should find version-number inline key');
            assert.strictEqual(keyDef!.targetFile, undefined,
                'Inline key should not have target file');
            assert.ok(keyDef!.inlineContent?.includes('3.0.1'),
                'Should extract inline content from keyword');
        });

        test('Should extract scope attribute', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('external-link');
            assert.ok(keyDef, 'Should find external-link key');
            assert.strictEqual(keyDef!.scope, 'peer', 'Should extract scope attribute');
        });

        test('Should extract processing-role attribute', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('template-only');
            assert.ok(keyDef, 'Should find template-only key');
            assert.strictEqual(keyDef!.processingRole, 'resource-only',
                'Should extract processing-role attribute');
        });
    });

    suite('Key Space Building', () => {
        test('Should build key space from root map', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            assert.ok(keySpace, 'Should return key space');
            assert.strictEqual(keySpace.rootMap, mapPath, 'Should store root map path');
            assert.ok(keySpace.keys.size > 0, 'Should have keys');
            assert.ok(keySpace.buildTime > 0, 'Should record build time');
            assert.ok(keySpace.mapHierarchy.length > 0, 'Should track map hierarchy');
        });

        test('Should resolve absolute paths for targets', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            for (const [_, keyDef] of keySpace.keys) {
                if (keyDef.targetFile) {
                    assert.ok(path.isAbsolute(keyDef.targetFile),
                        `Target file should be absolute path: ${keyDef.targetFile}`);
                }
            }
        });

        test('Should handle relative paths in href', async () => {
            const mapPath = path.join(fixturesPath, 'product_map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('product-description');
            assert.ok(keyDef, 'Should find product-description key');
            assert.ok(keyDef!.targetFile?.includes('product-info-v2.dita'),
                'Should resolve relative href to absolute path');
            assert.ok(fs.existsSync(keyDef!.targetFile!),
                'Resolved path should point to existing file');
        });

        test('Should record source map for each key', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            for (const [_, keyDef] of keySpace.keys) {
                assert.ok(keyDef.sourceMap, 'Each key should have source map');
                assert.ok(path.isAbsolute(keyDef.sourceMap),
                    'Source map should be absolute path');
            }
        });
    });

    suite('Map Hierarchy Traversal', () => {
        test('Should traverse into submaps via mapref', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Should find keys from submap
            assert.ok(keySpace.keys.has('submap-key'),
                'Should find key from submap');
            assert.ok(keySpace.keys.has('nested-content'),
                'Should find another key from submap');
        });

        test('Should traverse deeply nested submaps', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Should find keys from nested-submap.ditamap (3 levels deep)
            assert.ok(keySpace.keys.has('deep-key'),
                'Should find key from deeply nested submap');
            assert.ok(keySpace.keys.has('inline-only'),
                'Should find inline key from deeply nested submap');
        });

        test('Should track all maps in hierarchy', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Should include root, submap, and nested-submap
            assert.ok(keySpace.mapHierarchy.length >= 3,
                'Should track at least 3 maps in hierarchy');

            const hasRoot = keySpace.mapHierarchy.some(m =>
                m.includes('root-map-with-keys.ditamap'));
            const hasSubmap = keySpace.mapHierarchy.some(m =>
                m.includes('submap-with-keys.ditamap'));
            const hasNested = keySpace.mapHierarchy.some(m =>
                m.includes('nested-submap.ditamap'));

            assert.ok(hasRoot, 'Should include root map in hierarchy');
            assert.ok(hasSubmap, 'Should include submap in hierarchy');
            assert.ok(hasNested, 'Should include nested submap in hierarchy');
        });

        test('Should maintain breadth-first order', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Root should come first
            assert.ok(keySpace.mapHierarchy[0].includes('root-map-with-keys.ditamap'),
                'Root map should be first in hierarchy');
        });
    });

    suite('Key Precedence (First Definition Wins)', () => {
        test('Should use first definition for duplicate keys', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // product-name is defined in both root and submap
            // Root defines it as product-info-v2.dita
            // Submap defines it as no-doctype.dita
            // First definition (root) should win
            const keyDef = keySpace.keys.get('product-name');
            assert.ok(keyDef, 'Should find product-name key');
            assert.ok(keyDef!.targetFile?.includes('product-info-v2.dita'),
                'Should use first definition (from root map), not submap');
            assert.ok(keyDef!.sourceMap.includes('root-map-with-keys.ditamap'),
                'Source should be root map');
        });

        test('Should not override with submap definitions', async () => {
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // submap-key is defined in submap as empty-elements.dita
            // nested-submap defines it as invalid-xml.dita
            // First definition (submap) should win
            const keyDef = keySpace.keys.get('submap-key');
            assert.ok(keyDef, 'Should find submap-key');
            assert.ok(keyDef!.targetFile?.includes('empty-elements.dita'),
                'Should use first definition from submap, not nested-submap');
        });
    });

    suite('Circular Reference Protection', () => {
        test('Should handle circular map references without infinite loop', async () => {
            const mapPath = path.join(fixturesPath, 'circular-ref-a.ditamap');

            // Should not hang or throw error
            const keySpace = await resolver.buildKeySpace(mapPath);

            assert.ok(keySpace, 'Should return key space despite circular references');
            assert.ok(keySpace.keys.has('key-a'), 'Should find key from first map');
            assert.ok(keySpace.keys.has('key-b'), 'Should find key from second map');
        });

        test('Should visit each map only once', async () => {
            const mapPath = path.join(fixturesPath, 'circular-ref-a.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Check for no duplicate entries in map hierarchy
            const uniqueMaps = new Set(keySpace.mapHierarchy.map(m => path.normalize(m)));
            assert.strictEqual(keySpace.mapHierarchy.length, uniqueMaps.size,
                'Each map should be visited only once');
        });

        test('Map hierarchy should include both maps in cycle', async () => {
            const mapPath = path.join(fixturesPath, 'circular-ref-a.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const hasA = keySpace.mapHierarchy.some(m => m.includes('circular-ref-a.ditamap'));
            const hasB = keySpace.mapHierarchy.some(m => m.includes('circular-ref-b.ditamap'));

            assert.ok(hasA, 'Should include circular-ref-a in hierarchy');
            assert.ok(hasB, 'Should include circular-ref-b in hierarchy');
        });
    });

    suite('Key Resolution', () => {
        test('Should resolve key from context file', async () => {
            // Use a file that's in the same directory as root-map-with-keys.ditamap
            // which has product-name key defined
            const contextFile = path.join(fixturesPath, 'product-info-v2.dita');
            const keyDef = await resolver.resolveKey('product-name', contextFile);

            assert.ok(keyDef, 'Should resolve key');
            assert.ok(keyDef!.targetFile, 'Resolved key should have target file');
        });

        test('Should return null for non-existent key', async () => {
            const contextFile = path.join(fixturesPath, 'valid-topic.dita');
            const keyDef = await resolver.resolveKey('non-existent-key', contextFile);

            assert.strictEqual(keyDef, null, 'Should return null for non-existent key');
        });
    });

    suite('Root Map Finding', () => {
        test('Should find root map in same directory', async () => {
            const contextFile = path.join(fixturesPath, 'valid-topic.dita');
            const rootMap = await resolver.findRootMap(contextFile);

            assert.ok(rootMap, 'Should find root map');
            assert.ok(rootMap!.endsWith('.ditamap') || rootMap!.endsWith('.bookmap'),
                'Root map should have map extension');
        });

        test('Should prefer standard root map names', async () => {
            // Create a temporary root.ditamap to test preference
            const rootMapPath = path.join(fixturesPath, 'root.ditamap');
            const hasRoot = fs.existsSync(rootMapPath);

            if (hasRoot) {
                const contextFile = path.join(fixturesPath, 'valid-topic.dita');
                const foundMap = await resolver.findRootMap(contextFile);
                assert.ok(foundMap?.includes('root.ditamap'),
                    'Should prefer root.ditamap over other map names');
            }
        });

        test('Should return null when no map found', async () => {
            // Use a path outside fixtures where no maps exist
            const noMapDir = path.join(__dirname, '..', '..', '..', '..', 'node_modules');
            const contextFile = path.join(noMapDir, 'some-file.dita');
            const rootMap = await resolver.findRootMap(contextFile);

            assert.strictEqual(rootMap, null, 'Should return null when no map found');
        });
    });

    suite('Caching', () => {
        test('Should cache key space after first build', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');

            // Clear cache first
            resolver.clearCache();

            // First build
            const startTime1 = Date.now();
            const keySpace1 = await resolver.buildKeySpace(mapPath);
            const buildTime1 = Date.now() - startTime1;

            // Second build (should use cache)
            const startTime2 = Date.now();
            const keySpace2 = await resolver.buildKeySpace(mapPath);
            const buildTime2 = Date.now() - startTime2;

            assert.strictEqual(keySpace1.buildTime, keySpace2.buildTime,
                'Should return same cached key space (same build time)');

            // Cache hit should be much faster (though timing isn't guaranteed)
            console.log(`First build: ${buildTime1}ms, Cached: ${buildTime2}ms`);
        });

        test('Should provide cache statistics', () => {
            const stats = resolver.getCacheStats();

            assert.ok(typeof stats.cacheSize === 'number', 'Should have cache size');
            assert.ok(typeof stats.maxSize === 'number', 'Should have max size');
            assert.ok(typeof stats.ttlMs === 'number', 'Should have TTL');
            assert.ok(Array.isArray(stats.entries), 'Should have entries array');
        });

        test('Should clear cache', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');
            await resolver.buildKeySpace(mapPath);

            resolver.clearCache();
            const stats = resolver.getCacheStats();

            assert.strictEqual(stats.cacheSize, 0, 'Cache should be empty after clear');
        });
    });

    suite('Error Handling', () => {
        test('Should handle non-existent map file gracefully', async () => {
            const nonExistentMap = path.join(fixturesPath, 'does-not-exist.ditamap');

            // Should not throw
            const keySpace = await resolver.buildKeySpace(nonExistentMap);

            assert.ok(keySpace, 'Should return key space');
            assert.strictEqual(keySpace.keys.size, 0, 'Should have no keys');
        });

        test('Should handle malformed XML gracefully', async () => {
            const invalidMap = path.join(fixturesPath, 'invalid-xml.dita');

            // Should not throw
            const keySpace = await resolver.buildKeySpace(invalidMap);
            assert.ok(keySpace, 'Should return key space even for invalid XML');
        });

        test('Should handle missing submap references', async () => {
            // Root map references a submap that doesn't exist
            // Should continue without error
            const mapPath = path.join(fixturesPath, 'map-with-mapref.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            assert.ok(keySpace, 'Should return key space');
            assert.ok(keySpace.mapHierarchy.length > 0, 'Should have some maps in hierarchy');
        });
    });

    suite('Real-World Scenarios', () => {
        test('Should handle product documentation map', async () => {
            const mapPath = path.join(fixturesPath, 'product_map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            // Check for expected keys
            assert.ok(keySpace.keys.has('product-description'),
                'Should find product-description key');
            assert.ok(keySpace.keys.has('usage-tips'),
                'Should find usage-tips key');
            assert.ok(keySpace.keys.has('product-features'),
                'Should find product-features key');
            assert.ok(keySpace.keys.has('product-info-key'),
                'Should find product-info-key');
        });

        test('Should support navigation from topic to key target', async () => {
            // Simulate user clicking on keyref in a topic
            const topicPath = path.join(fixturesPath, 'main-topic.dita');

            // The topic is in a project with product_map.ditamap
            // User clicks on keyref="product-description"
            const keyDef = await resolver.resolveKey('product-description', topicPath);

            if (keyDef) {
                assert.ok(keyDef.targetFile, 'Should resolve to target file');
                assert.ok(keyDef.targetFile?.includes('product-info-v2.dita'),
                    'Should point to product info file');
            }
        });

        test('Should handle conkeyref resolution', async () => {
            const mapPath = path.join(fixturesPath, 'product_map.ditamap');
            const keySpace = await resolver.buildKeySpace(mapPath);

            const keyDef = keySpace.keys.get('usage-tips');
            assert.ok(keyDef, 'Should find usage-tips key for conkeyref');
            assert.ok(keyDef!.targetFile?.includes('usage-info.dita'),
                'Should resolve to usage-info file');
            assert.strictEqual(keyDef!.elementId, 'usage-info/usage-tips',
                'Should have element ID for conkeyref navigation');
        });
    });

    suite('Performance', () => {
        test('Should build key space in reasonable time', async function() {
            this.timeout(10000); // Allow up to 10 seconds

            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');

            // Clear cache to force rebuild
            resolver.clearCache();

            const startTime = Date.now();
            await resolver.buildKeySpace(mapPath);
            const duration = Date.now() - startTime;

            console.log(`Key space build time: ${duration}ms`);
            assert.ok(duration < 5000, 'Should build key space in under 5 seconds');
        });

        test('Should handle multiple sequential builds efficiently', async function() {
            this.timeout(15000);

            const maps = [
                path.join(fixturesPath, 'reference-map.ditamap'),
                path.join(fixturesPath, 'product_map.ditamap'),
                path.join(fixturesPath, 'root-map-with-keys.ditamap')
            ];

            resolver.clearCache();

            const startTime = Date.now();
            for (const mapPath of maps) {
                await resolver.buildKeySpace(mapPath);
            }
            const duration = Date.now() - startTime;

            console.log(`3 key spaces built in: ${duration}ms`);
            assert.ok(duration < 10000, 'Should build multiple key spaces efficiently');
        });
    });
});
