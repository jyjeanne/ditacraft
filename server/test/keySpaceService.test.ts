import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { KeySpaceService } from '../src/services/keySpaceService';

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

function createService(tmpDir: string): KeySpaceService {
    return new KeySpaceService(
        [tmpDir],
        async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
        () => {}
    );
}

suite('KeySpaceService', () => {

    suite('buildKeySpace', () => {

        test('basic key extraction', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="mykey" href="target.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('mykey'), 'key space should contain "mykey"');
                const keyDef = keySpace.keys.get('mykey')!;
                assert.strictEqual(keyDef.keyName, 'mykey');
                assert.ok(keyDef.targetFile?.endsWith('target.dita'));
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('multiple keys on single keydef', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="key1 key2" href="target.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('key1'), 'key space should contain "key1"');
                assert.ok(keySpace.keys.has('key2'), 'key space should contain "key2"');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('first definition wins', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="dup" href="first.dita"/>
  <keydef keys="dup" href="second.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const keyDef = keySpace.keys.get('dup')!;
                assert.ok(keyDef.targetFile?.endsWith('first.dita'), 'first definition should win');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('submap traversal', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="sub.ditamap"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'sub.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="subkey" href="target.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('subkey'), 'key space should contain key from submap');
                assert.ok(
                    keySpace.mapHierarchy.length >= 2,
                    'map hierarchy should include both root and sub maps'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('resolveKey', () => {

        test('finds key', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="found" href="target.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('found', contextFile);
                assert.ok(result, 'resolveKey should return a definition');
                assert.strictEqual(result!.keyName, 'found');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('returns null for unknown key', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="existing" href="target.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('nonexistent', contextFile);
                assert.strictEqual(result, null, 'resolveKey should return null for unknown key');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('findRootMap', () => {

        test('discovers ditamap in directory', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'myproject.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map/>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const rootMap = await service.findRootMap(contextFile);
                assert.ok(rootMap, 'findRootMap should discover the ditamap');
                assert.ok(
                    rootMap!.endsWith('myproject.ditamap'),
                    `expected path ending with myproject.ditamap, got: ${rootMap}`
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('explicit root map takes priority', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const autoMap = path.join(tmpDir, 'auto.ditamap');
                fs.writeFileSync(autoMap, `<?xml version="1.0"?>
<map/>`, 'utf-8');

                const explicitMap = path.join(tmpDir, 'explicit.ditamap');
                fs.writeFileSync(explicitMap, `<?xml version="1.0"?>
<map/>`, 'utf-8');

                service.setExplicitRootMap(explicitMap);

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const rootMap = await service.findRootMap(contextFile);
                assert.strictEqual(
                    rootMap,
                    explicitMap,
                    'findRootMap should return the explicit root map'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('getSubjectSchemePaths', () => {

        test('detects subject scheme maps', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const schemePath = path.join(tmpDir, 'scheme.ditamap');
                fs.writeFileSync(schemePath, `<?xml version="1.0"?>
<subjectScheme>
  <subjectdef keys="os">
    <subjectdef keys="linux"/>
    <subjectdef keys="windows"/>
  </subjectdef>
</subjectScheme>`, 'utf-8');

                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="scheme.ditamap"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const schemePaths = await service.getSubjectSchemePaths(contextFile);
                assert.ok(schemePaths.length > 0, 'should detect at least one subject scheme map');
                assert.ok(
                    schemePaths.some(p => p.endsWith('scheme.ditamap')),
                    'subject scheme paths should include scheme.ditamap'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('keyscope nesting', () => {

        test('root map keyscope produces scope-qualified key names', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map keyscope="product">
  <keydef keys="version" href="v1.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('version'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('product.version'), 'scope-qualified key should exist');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('submap keyscope produces scope-qualified key names', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="sub.ditamap" keyscope="lib"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'sub.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('api'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('lib.api'), 'scope-qualified key should exist');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('nested keyscopes produce dot-separated qualified names', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map keyscope="product">
  <mapref href="sub.ditamap" keyscope="module"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'sub.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="config" href="config.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('config'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('product.module.config'),
                    'nested scope-qualified key should exist');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('multiple keyscopes on single element produce multiple qualified names', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map keyscope="scopeA scopeB">
  <keydef keys="item" href="item.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('item'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('scopeA.item'), 'first scope-qualified key should exist');
                assert.ok(keySpace.keys.has('scopeB.item'), 'second scope-qualified key should exist');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('keyscope on submap root element is applied', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="scoped.ditamap"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'scoped.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map keyscope="inner">
  <keydef keys="detail" href="detail.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('detail'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('inner.detail'),
                    'root-level keyscope on submap should produce qualified key');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('first definition wins within same scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map keyscope="scope">
  <keydef keys="dup" href="first.dita"/>
  <keydef keys="dup" href="second.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const qualified = keySpace.keys.get('scope.dup');
                assert.ok(qualified, 'scope-qualified key should exist');
                assert.ok(qualified!.targetFile?.endsWith('first.dita'),
                    'first definition should win for scope-qualified key');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('no keyscope means no qualified keys added', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="plain" href="plain.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('plain'), 'unqualified key should exist');
                // No scope-qualified keys should be generated
                const allKeys = Array.from(keySpace.keys.keys());
                const dotKeys = allKeys.filter(k => k.includes('.'));
                assert.strictEqual(dotKeys.length, 0, 'no dot-qualified keys without keyscope');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('keyref chain resolution', () => {

        test('keyref attribute is captured on KeyDefinition', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="alias" keyref="real"/>
  <keydef keys="real" href="real.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const aliasDef = keySpace.keys.get('alias');
                assert.ok(aliasDef, 'alias key should exist');
                assert.strictEqual(aliasDef!.keyref, 'real', 'keyref attribute should be captured');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('resolveKey follows keyref chain to final definition', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="alias" keyref="real"/>
  <keydef keys="real" href="real.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('alias', contextFile);
                assert.ok(result, 'alias key should resolve');
                assert.ok(result!.targetFile?.endsWith('real.dita'),
                    'resolved definition should point to real.dita, not alias');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('multi-hop keyref chain resolves transitively', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="a" keyref="b"/>
  <keydef keys="b" keyref="c"/>
  <keydef keys="c" href="final.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('a', contextFile);
                assert.ok(result, 'multi-hop keyref should resolve');
                assert.ok(result!.targetFile?.endsWith('final.dita'),
                    'should resolve through full chain to final.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('cyclic keyref does not hang — returns a definition', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="x" keyref="y"/>
  <keydef keys="y" keyref="x"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                // Must not throw or hang; result may be x or y but must be non-null
                const result = await service.resolveKey('x', contextFile);
                assert.ok(result, 'cyclic keyref should return a definition, not null');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('keyref to missing key returns the alias definition itself', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="alias" keyref="nonexistent"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('alias', contextFile);
                assert.ok(result, 'alias with broken chain should still return a definition');
                assert.strictEqual(result!.keyName, 'alias',
                    'broken chain returns the alias definition itself');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('PushDown scope inheritance', () => {

        test('ancestor key is accessible via child-scope qualified name', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="logo" href="logo.dita"/>
  <mapref href="lib.ditamap" keyscope="lib"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'lib.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('logo'), 'unqualified ancestor key should exist');
                assert.ok(keySpace.keys.has('lib.api'), 'child scope key should exist');
                assert.ok(keySpace.keys.has('lib.logo'),
                    'PushDown should make ancestor key available as lib.logo');
                assert.ok(
                    keySpace.keys.get('lib.logo')!.targetFile?.endsWith('logo.dita'),
                    'inherited lib.logo should point to logo.dita'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('child-scope override wins over ancestor key in qualified namespace', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="v1.dita"/>
  <mapref href="product.ditamap" keyscope="product"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'product.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="v2.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // product.version should be the child scope's definition (v2), not the root's (v1)
                const productVersion = keySpace.keys.get('product.version');
                assert.ok(productVersion, 'product.version should exist');
                assert.ok(
                    productVersion!.targetFile?.endsWith('v2.dita'),
                    'child-scope override should win for product.version'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('deeply nested scope inherits from all ancestors', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="brand" href="brand.dita"/>
  <mapref href="product.ditamap" keyscope="product"/>
</map>`, 'utf-8');

                const midPath = path.join(tmpDir, 'product.ditamap');
                fs.writeFileSync(midPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="v1.dita"/>
  <mapref href="module.ditamap" keyscope="module"/>
</map>`, 'utf-8');

                const leafPath = path.join(tmpDir, 'module.ditamap');
                fs.writeFileSync(leafPath, `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // product.module.api — direct key
                assert.ok(keySpace.keys.has('product.module.api'), 'direct leaf key should exist');
                // product.module.version — inherited from product scope via PushDown
                assert.ok(keySpace.keys.has('product.module.version'),
                    'PushDown should inherit product.version into product.module namespace');
                // product.module.brand — inherited from root scope via PushDown
                assert.ok(keySpace.keys.has('product.module.brand'),
                    'PushDown should inherit root brand into product.module namespace');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('context-aware key resolution', () => {

        test('resolveKey uses child-scope definition when context is in that scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="v1.dita"/>
  <mapref href="product.ditamap" keyscope="product"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'product.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="v2.dita"/>
  <topicref href="product-guide.dita"/>
</map>`, 'utf-8');

                // product-guide.dita is within the "product" scope
                const productGuide = path.join(tmpDir, 'product-guide.dita');
                fs.writeFileSync(productGuide, '', 'utf-8');

                // A topic outside any named scope
                const rootTopic = path.join(tmpDir, 'root-topic.dita');
                fs.writeFileSync(rootTopic, '', 'utf-8');

                // From product-guide (product scope) → should get v2
                const fromProduct = await service.resolveKey('version', productGuide);
                assert.ok(fromProduct, 'version should resolve from product-guide context');
                assert.ok(
                    fromProduct!.targetFile?.endsWith('v2.dita'),
                    'context-aware resolution should return product scope version (v2)'
                );

                // From root-topic (no named scope) → should get v1
                const fromRoot = await service.resolveKey('version', rootTopic);
                assert.ok(fromRoot, 'version should resolve from root-topic context');
                assert.ok(
                    fromRoot!.targetFile?.endsWith('v1.dita'),
                    'context-free resolution should return root scope version (v1)'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('topicToScope maps topic to its owning scope prefix', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="lib.ditamap" keyscope="lib"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'lib.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <topicref href="lib-guide.dita"/>
</map>`, 'utf-8');

                const guidePath = path.join(tmpDir, 'lib-guide.dita');
                fs.writeFileSync(guidePath, '', 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                const scopePrefix = keySpace.topicToScope.get(path.normalize(guidePath));
                assert.strictEqual(scopePrefix, 'lib',
                    'lib-guide.dita should be recorded in the "lib" scope');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });
});
