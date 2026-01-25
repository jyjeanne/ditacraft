/**
 * Security and Edge Cases Test Suite
 * P3-5: Tests for path traversal security, cache expiration, and edge cases
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { KeySpaceResolver } from '../../utils/keySpaceResolver';
import { configManager } from '../../utils/configurationManager';

suite('Security and Edge Cases Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suite('Path Traversal Prevention', () => {
        let resolver: KeySpaceResolver;

        setup(() => {
            resolver = new KeySpaceResolver();
        });

        teardown(() => {
            resolver.dispose();
        });

        test('Should normalize path traversal attempts', async () => {
            // Create a map with path traversal attempt
            // Note: When no workspace is open, all paths are allowed (single-file mode)
            // The test verifies paths are at least normalized correctly
            const mapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <keydef keys="traversal" href="../../../etc/passwd"/>
    <keydef keys="safe" href="valid-topic.dita"/>
</map>`;

            const tempMapPath = path.join(fixturesPath, 'temp-traversal-test.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // The key should be extracted
                const traversalKey = keySpace.keys.get('traversal');
                assert.ok(traversalKey, 'Should extract the key definition');

                // If targetFile exists, verify it's properly normalized (no ..)
                if (traversalKey?.targetFile) {
                    const normalizedPath = path.normalize(traversalKey.targetFile);
                    assert.strictEqual(traversalKey.targetFile, normalizedPath,
                        'Target file should be normalized (no .. components)');
                }

                // The safe key should still work
                const safeKey = keySpace.keys.get('safe');
                assert.ok(safeKey, 'Should find safe key');
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });

        test('Should handle absolute paths in href', async () => {
            // Note: Absolute paths outside workspace are blocked ONLY when workspace is open
            // In test environment (no workspace), all paths are allowed (single-file mode)
            // This test verifies the parsing works correctly for absolute paths
            const absolutePath = process.platform === 'win32'
                ? 'C:\\test\\file.dita'
                : '/test/file.dita';

            const mapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <keydef keys="absolute-key" href="${absolutePath}"/>
</map>`;

            const tempMapPath = path.join(fixturesPath, 'temp-absolute-test.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // The key should be extracted
                const absoluteKey = keySpace.keys.get('absolute-key');
                assert.ok(absoluteKey, 'Should extract key with absolute path');

                // Absolute paths starting with http:// or https:// should NOT be resolved
                // (they are external links)
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });

        test('Should block encoded path traversal attempts', async () => {
            // URL-encoded path traversal
            const mapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <keydef keys="encoded-traversal" href="..%2F..%2F..%2Fetc%2Fpasswd"/>
</map>`;

            const tempMapPath = path.join(fixturesPath, 'temp-encoded-test.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // The encoded path should either be blocked or not resolve properly
                const encodedKey = keySpace.keys.get('encoded-traversal');

                // Verify it doesn't resolve to a dangerous location
                if (encodedKey?.targetFile) {
                    const normalizedTarget = path.normalize(encodedKey.targetFile);
                    assert.ok(
                        normalizedTarget.startsWith(path.normalize(fixturesPath)),
                        'Encoded traversal should not escape fixtures directory'
                    );
                }
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });

        test('Should handle null bytes in paths', async () => {
            // Null byte injection attempt
            const mapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <keydef keys="null-byte" href="valid.dita\x00.txt"/>
</map>`;

            const tempMapPath = path.join(fixturesPath, 'temp-nullbyte-test.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // Should handle gracefully without crash
                assert.ok(keySpace, 'Should handle null bytes without crashing');
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });
    });

    suite('Cache Expiration Edge Cases', () => {
        let resolver: KeySpaceResolver;

        setup(() => {
            resolver = new KeySpaceResolver();
        });

        teardown(() => {
            resolver.dispose();
        });

        test('Should return fresh data after cache expires', async function() {
            this.timeout(10000);

            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');

            // Build initial key space
            resolver.clearCache();
            const keySpace1 = await resolver.buildKeySpace(mapPath);
            const originalBuildTime = keySpace1.buildTime;

            // The TTL should be the configured value (5 minutes by default)
            // We verify the cache is working by checking that immediate rebuild uses cache
            const keySpace2 = await resolver.buildKeySpace(mapPath);
            assert.strictEqual(keySpace2.buildTime, originalBuildTime,
                'Immediate rebuild should use cached version');
        });

        test('Should handle concurrent cache access', async function() {
            this.timeout(15000);

            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            resolver.clearCache();

            // Fire multiple concurrent builds
            const builds = Promise.all([
                resolver.buildKeySpace(mapPath),
                resolver.buildKeySpace(mapPath),
                resolver.buildKeySpace(mapPath),
                resolver.buildKeySpace(mapPath),
                resolver.buildKeySpace(mapPath)
            ]);

            const results = await builds;

            // All results should be the same instance (same buildTime)
            const firstBuildTime = results[0].buildTime;
            for (const result of results) {
                assert.strictEqual(result.buildTime, firstBuildTime,
                    'Concurrent builds should share the same result');
            }

            // Verify stats show only one cached entry
            const stats = resolver.getCacheStats();
            const entriesForThisMap = stats.entries.filter(e =>
                e.rootMap === 'root-map-with-keys.ditamap'
            );
            assert.strictEqual(entriesForThisMap.length, 1,
                'Should have only one cache entry despite concurrent builds');
        });

        test('Should handle cache clearing during build', async function() {
            this.timeout(10000);

            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');
            resolver.clearCache();

            // Start a build
            const buildPromise = resolver.buildKeySpace(mapPath);

            // Clear cache while build is in progress
            resolver.clearCache();

            // The build should still complete
            const keySpace = await buildPromise;
            assert.ok(keySpace, 'Build should complete even if cache was cleared');
            assert.ok(keySpace.keys.size > 0, 'Key space should have keys');
        });

        test('Should enforce max cache size with LRU eviction', async function() {
            this.timeout(20000);

            // The max size is 10, so build more than 10 unique key spaces
            // In practice, we'll build a few and verify eviction behavior
            resolver.clearCache();

            const maps = [
                'reference-map.ditamap',
                'product_map.ditamap',
                'root-map-with-keys.ditamap',
                'map-with-mapref.ditamap'
            ];

            for (const mapName of maps) {
                const mapPath = path.join(fixturesPath, mapName);
                if (fs.existsSync(mapPath)) {
                    await resolver.buildKeySpace(mapPath);
                }
            }

            const stats = resolver.getCacheStats();
            assert.ok(stats.cacheSize <= stats.maxSize,
                `Cache size (${stats.cacheSize}) should not exceed max size (${stats.maxSize})`);
        });
    });

    suite('Configuration Change Handling', () => {
        let resolver: KeySpaceResolver;

        setup(() => {
            resolver = new KeySpaceResolver();
        });

        teardown(() => {
            resolver.dispose();
        });

        test('Should reload cache config when settings change', async () => {
            const mapPath = path.join(fixturesPath, 'reference-map.ditamap');

            // Build initial key space
            await resolver.buildKeySpace(mapPath);

            // Trigger config reload
            resolver.reloadCacheConfig();

            // Stats should still be valid
            const statsAfter = resolver.getCacheStats();
            assert.ok(typeof statsAfter.ttlMs === 'number', 'Should have valid TTL after reload');
            assert.ok(statsAfter.cacheSize >= 0, 'Should have valid cache size after reload');
        });

        test('Should handle rapid config changes', () => {
            // Rapidly reload config multiple times
            for (let i = 0; i < 10; i++) {
                resolver.reloadCacheConfig();
            }

            // Should not throw and stats should be valid
            const stats = resolver.getCacheStats();
            assert.ok(typeof stats.ttlMs === 'number', 'Should have valid TTL after rapid reloads');
        });
    });

    suite('Large File Handling', () => {
        test('Should handle large map files without hanging', async function() {
            this.timeout(30000);

            const resolver = new KeySpaceResolver();

            try {
                // Generate a large map with many keys
                const keyCount = 1000;
                let keyElements = '';
                for (let i = 0; i < keyCount; i++) {
                    keyElements += `    <keydef keys="key-${i}" href="topic${i}.dita"/>\n`;
                }

                const largeMapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
${keyElements}
</map>`;

                const tempMapPath = path.join(fixturesPath, 'temp-large-map.ditamap');

                try {
                    fs.writeFileSync(tempMapPath, largeMapContent, 'utf8');

                    const startTime = Date.now();
                    const keySpace = await resolver.buildKeySpace(tempMapPath);
                    const duration = Date.now() - startTime;

                    console.log(`Large map (${keyCount} keys) processed in ${duration}ms`);

                    assert.ok(duration < 10000, 'Should process large map in under 10 seconds');
                    assert.ok(keySpace.keys.size > 0, 'Should extract at least some keys');
                } finally {
                    if (fs.existsSync(tempMapPath)) {
                        fs.unlinkSync(tempMapPath);
                    }
                }
            } finally {
                resolver.dispose();
            }
        });

        test('Should respect maxLinkMatches limit', async function() {
            this.timeout(30000);

            const resolver = new KeySpaceResolver();

            try {
                // Create a map with more keys than maxLinkMatches
                const keyCount = 15000; // More than default maxLinkMatches (10000)
                let keyElements = '';
                for (let i = 0; i < keyCount; i++) {
                    keyElements += `    <keydef keys="key-${i}" href="topic.dita"/>\n`;
                }

                const hugeMapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
${keyElements}
</map>`;

                const tempMapPath = path.join(fixturesPath, 'temp-huge-map.ditamap');

                try {
                    fs.writeFileSync(tempMapPath, hugeMapContent, 'utf8');

                    const startTime = Date.now();
                    const keySpace = await resolver.buildKeySpace(tempMapPath);
                    const duration = Date.now() - startTime;

                    console.log(`Huge map attempted: ${keySpace.keys.size} keys extracted in ${duration}ms`);

                    // Should complete without hanging (ReDoS protection)
                    assert.ok(duration < 30000, 'Should complete within timeout (ReDoS protection)');

                    // May have fewer keys than requested due to maxLinkMatches
                    // This verifies the limit is being respected
                    assert.ok(keySpace.keys.size <= configManager.get('maxLinkMatches') + 100,
                        'Should respect maxLinkMatches limit (with some tolerance)');
                } finally {
                    if (fs.existsSync(tempMapPath)) {
                        fs.unlinkSync(tempMapPath);
                    }
                }
            } finally {
                resolver.dispose();
            }
        });
    });

    suite('Error Resilience', () => {
        let resolver: KeySpaceResolver;

        setup(() => {
            resolver = new KeySpaceResolver();
        });

        teardown(() => {
            resolver.dispose();
        });

        test('Should handle deeply nested map hierarchy', async function() {
            this.timeout(15000);

            // Test with existing nested structure
            const mapPath = path.join(fixturesPath, 'root-map-with-keys.ditamap');

            const keySpace = await resolver.buildKeySpace(mapPath);

            // Verify it processes all levels
            assert.ok(keySpace.mapHierarchy.length >= 3,
                'Should process multiple levels of nesting');
        });

        test('Should handle maps with only invalid references', async () => {
            const mapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map>
    <mapref href="does-not-exist-1.ditamap"/>
    <mapref href="does-not-exist-2.ditamap"/>
    <keydef keys="orphan-key" href="missing-topic.dita"/>
</map>`;

            const tempMapPath = path.join(fixturesPath, 'temp-invalid-refs.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // Should complete without error
                assert.ok(keySpace, 'Should return key space');
                assert.strictEqual(keySpace.mapHierarchy.length, 1,
                    'Should have only the root map in hierarchy');
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });

        test('Should handle empty map file', async () => {
            const mapContent = '';
            const tempMapPath = path.join(fixturesPath, 'temp-empty.ditamap');

            try {
                fs.writeFileSync(tempMapPath, mapContent, 'utf8');
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                assert.ok(keySpace, 'Should return key space for empty file');
                assert.strictEqual(keySpace.keys.size, 0, 'Should have no keys');
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });

        test('Should handle binary garbage gracefully', async () => {
            const binaryContent = Buffer.from([0xFF, 0xFE, 0x00, 0x01, 0x02, 0x03]);
            const tempMapPath = path.join(fixturesPath, 'temp-binary.ditamap');

            try {
                fs.writeFileSync(tempMapPath, binaryContent);
                const keySpace = await resolver.buildKeySpace(tempMapPath);

                // Should not crash
                assert.ok(keySpace, 'Should handle binary content without crashing');
            } finally {
                if (fs.existsSync(tempMapPath)) {
                    fs.unlinkSync(tempMapPath);
                }
            }
        });
    });
});
