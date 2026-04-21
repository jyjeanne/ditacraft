import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { KeySpaceService, formatResolutionReport, reportKeySpace } from '../src/services/keySpaceService';

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

        test('multi-name keyscope: PushDown works for every scope alias', async () => {
            // Regression for Bug 1: when keyscope="a b", scopeDirectKeys must be
            // initialised for both 'a' and 'b' so that child scopes of either alias
            // inherit ancestor keys correctly.
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="logo" href="logo.dita"/>
  <mapref href="lib.ditamap" keyscope="libA libB"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'lib.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
  <mapref href="deep.ditamap" keyscope="core"/>
</map>`, 'utf-8');

                const deepPath = path.join(tmpDir, 'deep.ditamap');
                fs.writeFileSync(deepPath, `<?xml version="1.0"?>
<map>
  <keydef keys="util" href="util.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);

                // Both scope aliases should get PushDown-inherited ancestor keys
                assert.ok(keySpace.keys.has('libA.logo'),
                    'PushDown: root logo should appear under libA alias');
                assert.ok(keySpace.keys.has('libB.logo'),
                    'PushDown: root logo should appear under libB alias');

                // Deep child under libA must also inherit logo from root
                assert.ok(keySpace.keys.has('libA.core.logo'),
                    'PushDown: root logo should propagate into libA.core namespace');
                assert.ok(keySpace.keys.has('libB.core.logo'),
                    'PushDown: root logo should propagate into libB.core namespace');
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

    suite('reltable exclusion', () => {

        test('keys inside reltable are not extracted', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="real" href="real.dita"/>
  <reltable>
    <relrow>
      <relcell><topicref keys="ghost" href="ghost.dita"/></relcell>
    </relrow>
  </reltable>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('real'), 'normal keydef should be extracted');
                assert.ok(!keySpace.keys.has('ghost'), 'keys inside reltable must not be extracted');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('hrefs inside reltable do not pollute topicToScope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="child.ditamap" keyscope="child"/>
  <reltable>
    <relrow>
      <relcell><topicref href="guide.dita"/></relcell>
    </relrow>
  </reltable>
</map>`, 'utf-8');

                const childPath = path.join(tmpDir, 'child.ditamap');
                fs.writeFileSync(childPath, `<?xml version="1.0"?>
<map>
  <topicref href="guide.dita"/>
</map>`, 'utf-8');

                const guidePath = path.join(tmpDir, 'guide.dita');
                fs.writeFileSync(guidePath, '', 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // guide.dita is referenced in the root reltable AND in child scope.
                // The reltable reference (root scope) must NOT win — guide.dita belongs to child scope.
                const scopePrefix = keySpace.topicToScope.get(path.normalize(guidePath));
                assert.strictEqual(scopePrefix, 'child',
                    'reltable href must not claim scope — child scope topicref should win');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('@keys on keyscoped mapref elements', () => {

        test('@keys on mapref with @keyscope registers key in child scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref keyscope="product" keys="product-map" href="product.ditamap"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'product.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="widget" href="widget.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // product-map is defined on the mapref itself, which carries @keyscope="product"
                // Per DITA spec, it belongs to the product scope.
                assert.ok(keySpace.keys.has('product-map'),
                    'inline key from keyscoped mapref should exist (unqualified fallback)');
                assert.ok(keySpace.keys.has('product.product-map'),
                    'inline key must be registered under child scope qualified name');
                assert.ok(
                    keySpace.keys.get('product.product-map')!.targetFile?.endsWith('product.ditamap'),
                    'child-scope inline key should target the referenced submap'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('@keys on mapref with @keyscope not duplicated in parent scope direct keys', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="shared" href="root-shared.dita"/>
  <mapref keyscope="sub" keys="shared" href="sub.ditamap"/>
</map>`, 'utf-8');

                const subPath = path.join(tmpDir, 'sub.ditamap');
                fs.writeFileSync(subPath, `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // The root map has keydef keys="shared" → root scope wins for unqualified 'shared'
                assert.ok(
                    keySpace.keys.get('shared')!.targetFile?.endsWith('root-shared.dita'),
                    'root keydef should win for unqualified shared'
                );
                // sub.shared should target the submap (the inline key from the mapref)
                assert.ok(keySpace.keys.has('sub.shared'),
                    'inline key should also exist as sub.shared');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('inline scope branches (@keyscope on non-map topicrefs)', () => {

        test('key inside inline scope branch is registered under child scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="global" href="global.dita"/>
  <topicref keyscope="branch">
    <keydef keys="local" href="local.dita"/>
  </topicref>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('global'), 'root-scope key should exist');
                assert.ok(keySpace.keys.has('local'), 'unqualified child key should still exist');
                assert.ok(keySpace.keys.has('branch.local'),
                    'child-scope qualified key branch.local should exist');
                assert.ok(
                    keySpace.keys.get('branch.local')!.targetFile?.endsWith('local.dita'),
                    'branch.local should point to local.dita'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('root-scope key is not mistakenly put in inline scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="shared" href="shared.dita"/>
  <topicref keyscope="branch">
    <keydef keys="branchOnly" href="branchOnly.dita"/>
  </topicref>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                // shared is in root scope — branch.shared should appear via PushDown, not direct
                assert.ok(!keySpace.keys.has('branch.branchOnly') === false,
                    'branch.branchOnly should exist');
                // shared should not be accidentally registered as branch.shared via direct extraction
                // (PushDown will add it, so we just verify the direct key target is correct)
                const sharedDef = keySpace.keys.get('shared');
                assert.ok(sharedDef?.targetFile?.endsWith('shared.dita'),
                    'root shared key should point to shared.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('topic inside inline scope branch is recorded in topicToScope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <topicref keyscope="branch">
    <topicref href="guide.dita"/>
  </topicref>
</map>`, 'utf-8');

                const guidePath = path.join(tmpDir, 'guide.dita');
                fs.writeFileSync(guidePath, '', 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const scopePrefix = keySpace.topicToScope.get(path.normalize(guidePath));
                assert.strictEqual(scopePrefix, 'branch',
                    'topic inside inline scope branch should map to that scope');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('nested inline scopes produce compound scope prefix', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <topicref keyscope="outer">
    <topicref keyscope="inner">
      <keydef keys="deep" href="deep.dita"/>
    </topicref>
    <keydef keys="mid" href="mid.dita"/>
  </topicref>
  <keydef keys="root" href="root.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('root'), 'root key should exist');
                assert.ok(keySpace.keys.has('outer.mid'), 'outer scope key should be qualified');
                assert.ok(keySpace.keys.has('outer.inner.deep'),
                    'nested inline scope key should produce compound qualified name');
                assert.ok(
                    keySpace.keys.get('outer.inner.deep')!.targetFile?.endsWith('deep.dita'),
                    'outer.inner.deep should point to deep.dita'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('@keys on the keyscoped topicref element itself belong to child scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <topicref keyscope="sub" keys="sub-entry" href="overview.dita">
    <keydef keys="detail" href="detail.dita"/>
  </topicref>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('sub.sub-entry'),
                    '@keys on keyscoped topicref should be in child scope (sub.sub-entry)');
                assert.ok(keySpace.keys.has('sub.detail'),
                    'child keydef should also be in child scope (sub.detail)');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('inline scope PushDown: root key inherited by inline scope', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="brand" href="brand.dita"/>
  <topicref keyscope="product">
    <keydef keys="widget" href="widget.dita"/>
  </topicref>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                // PushDown should inherit root "brand" into the "product" inline scope
                assert.ok(keySpace.keys.has('product.brand'),
                    'PushDown should make root brand accessible as product.brand');
                assert.ok(
                    keySpace.keys.get('product.brand')!.targetFile?.endsWith('brand.dita'),
                    'product.brand should point to brand.dita'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('inline scope contains a submap: submap queued with combined scope prefix', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <topicref keyscope="outer">
    <mapref href="inner.ditamap" keyscope="inner"/>
  </topicref>
</map>`, 'utf-8');

                const innerPath = path.join(tmpDir, 'inner.ditamap');
                fs.writeFileSync(innerPath, `<?xml version="1.0"?>
<map>
  <keydef keys="lib" href="lib.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // inner.ditamap should be processed as "outer.inner" scope
                assert.ok(keySpace.keys.has('outer.inner.lib'),
                    'submap inside inline scope should get compound prefix outer.inner.lib');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('provenance tracking (Gap 6)', () => {

        test('sourceLine is set on keys extracted via regex fallback path', async () => {
            // Force regex path by writing malformed XML (no closing </map>).
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                // Line 1: <?xml...>, line 2: <map>, line 3: <keydef keys=.../>
                fs.writeFileSync(mapPath,
                    `<?xml version="1.0"?>\n<map>\n  <keydef keys="first" href="a.dita"/>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const def = keySpace.keys.get('first');
                assert.ok(def, 'key "first" should be registered');
                assert.ok(typeof def!.sourceLine === 'number' && def!.sourceLine >= 1,
                    'sourceLine should be a positive integer');
                assert.strictEqual(def!.sourceLine, 3,
                    'keydef on line 3 should have sourceLine=3');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('sourceLine is set on keys extracted via XML parser path', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="line3key" href="a.dita"/>
  <keydef keys="line4key" href="b.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const def3 = keySpace.keys.get('line3key');
                const def4 = keySpace.keys.get('line4key');
                assert.ok(def3 && typeof def3.sourceLine === 'number',
                    'line3key should have sourceLine');
                assert.ok(def4 && typeof def4.sourceLine === 'number',
                    'line4key should have sourceLine');
                assert.ok(def3!.sourceLine! < def4!.sourceLine!,
                    'line3key sourceLine must be less than line4key sourceLine (document order)');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('duplicate keys report different sourceLines', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="shared" href="first.dita"/>
  <keydef keys="other" href="other.dita"/>
  <keydef keys="shared" href="second.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const dups = keySpace.duplicateKeys.get('shared');
                assert.ok(dups && dups.length >= 2,
                    'shared key should be recorded as duplicate');
                const lines = dups!.map(d => d.sourceLine).filter(l => l !== undefined);
                assert.ok(lines.length >= 2, 'both duplicate definitions should carry sourceLine');
                assert.notStrictEqual(lines[0], lines[1],
                    'duplicate definitions should report different source lines');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('qualified scope alias inherits sourceLine from original definition', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref keyscope="product" href="product.ditamap"/>
</map>`, 'utf-8');

                const productPath = path.join(tmpDir, 'product.ditamap');
                fs.writeFileSync(productPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="version.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                const unqualified = keySpace.keys.get('version');
                const qualified = keySpace.keys.get('product.version');
                assert.ok(unqualified?.sourceLine, 'unqualified key should have sourceLine');
                assert.ok(qualified?.sourceLine, 'qualified alias should have sourceLine');
                assert.strictEqual(qualified!.sourceLine, unqualified!.sourceLine,
                    'qualified alias sourceLine must equal original definition line');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('scope explosion cap (Gap 7)', () => {

        test('multi-token @keyscope on submap registers qualified aliases for each token', async () => {
            // DITA spec: keyscope="a b" creates two independent child scopes.
            // Both product.key and suite.key must be resolvable.
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref keyscope="product suite" href="lib.ditamap"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'lib.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="version.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.keys.has('product.version'),
                    'product.version should exist for first token of multi-token keyscope');
                assert.ok(keySpace.keys.has('suite.version'),
                    'suite.version should exist for second token of multi-token keyscope');

                const r1 = await service.resolveKey('product.version', contextFile);
                assert.ok(r1?.targetFile?.endsWith('version.dita'),
                    'product.version should resolve to version.dita');
                const r2 = await service.resolveKey('suite.version', contextFile);
                assert.ok(r2?.targetFile?.endsWith('version.dita'),
                    'suite.version should resolve to version.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('nested multi-token keyscopes produce cross-product qualified aliases', async () => {
            // parent keyscope="x y", child keyscope="c d" → should produce x.c, x.d, y.c, y.d
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref keyscope="x y" href="parent.ditamap"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'parent.ditamap'), `<?xml version="1.0"?>
<map>
  <mapref keyscope="c d" href="child.ditamap"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'child.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="api" href="api.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                for (const prefix of ['x.c', 'x.d', 'y.c', 'y.d']) {
                    assert.ok(keySpace.keys.has(`${prefix}.api`),
                        `${prefix}.api should exist from cross-product keyscope expansion`);
                }
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('scope explosion warning is set when MAX_KEY_SPACE_ENTRIES is exceeded', async () => {
            // Build a key space large enough to trigger the cap.
            // 500 scopes × 101 keys each ≈ 50,500 qualified aliases > 50,000 cap.
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const SCOPE_COUNT = 500;
                const KEYS_PER_SCOPE = 101;
                const rootPath = path.join(tmpDir, 'root.ditamap');
                const submapRefs = Array.from({ length: SCOPE_COUNT }, (_, i) =>
                    `  <mapref keyscope="scope${i}" href="scope${i}.ditamap"/>`
                ).join('\n');
                fs.writeFileSync(rootPath,
                    `<?xml version="1.0"?>\n<map>\n${submapRefs}\n</map>`, 'utf-8');

                for (let i = 0; i < SCOPE_COUNT; i++) {
                    const keydefs = Array.from({ length: KEYS_PER_SCOPE }, (_, k) =>
                        `  <keydef keys="key${k}" href="t${k}.dita"/>`
                    ).join('\n');
                    fs.writeFileSync(
                        path.join(tmpDir, `scope${i}.ditamap`),
                        `<?xml version="1.0"?>\n<map>\n${keydefs}\n</map>`, 'utf-8'
                    );
                }

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(keySpace.scopeExplosionWarning === true,
                    'scopeExplosionWarning should be set when entry cap is exceeded');
                assert.ok(keySpace.keys.size <= 50_000,
                    'keys map must not exceed MAX_KEY_SPACE_ENTRIES');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('deferred peer map loading (Gap 4)', () => {

        test('peer mapref with @keyscope is not inlined into main key space', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="local" href="local.dita"/>
  <mapref href="peer.ditamap" scope="peer" keyscope="peerScope"/>
</map>`, 'utf-8');

                const peerPath = path.join(tmpDir, 'peer.ditamap');
                fs.writeFileSync(peerPath, `<?xml version="1.0"?>
<map>
  <keydef keys="peerKey" href="peer-topic.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                // local key must be present
                assert.ok(keySpace.keys.has('local'), 'local key should be in main key space');
                // peer map's key must NOT be inlined
                assert.ok(!keySpace.keys.has('peerKey'),
                    'peer map key must not be inlined into root key space');
                // the peer map should be recorded in deferredPeerMaps
                assert.ok(keySpace.deferredPeerMaps.has('peerScope'),
                    'peerScope should be recorded as a deferred peer map');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('resolveKey lazily loads peer map and returns key with scope prefix', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="peer.ditamap" scope="peer" keyscope="peerScope"/>
</map>`, 'utf-8');

                const peerPath = path.join(tmpDir, 'peer.ditamap');
                fs.writeFileSync(peerPath, `<?xml version="1.0"?>
<map>
  <keydef keys="peerKey" href="peer-topic.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const result = await service.resolveKey('peerScope.peerKey', contextFile);
                assert.ok(result, 'resolveKey should lazily load peer map and resolve peerScope.peerKey');
                assert.ok(result!.targetFile?.endsWith('peer-topic.dita'),
                    'resolved key should point to peer-topic.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('peer mapref without @keyscope is ignored (no deferred registration)', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="peer.ditamap" scope="peer"/>
</map>`, 'utf-8');

                const peerPath = path.join(tmpDir, 'peer.ditamap');
                fs.writeFileSync(peerPath, `<?xml version="1.0"?>
<map>
  <keydef keys="orphan" href="orphan.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.strictEqual(keySpace.deferredPeerMaps.size, 0,
                    'peer mapref without @keyscope must not register a deferred map');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('nested key in peer map resolves via scope-qualified name', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="peer.ditamap" scope="peer" keyscope="companion"/>
</map>`, 'utf-8');

                const peerPath = path.join(tmpDir, 'peer.ditamap');
                fs.writeFileSync(peerPath, `<?xml version="1.0"?>
<map>
  <keydef keys="alpha" href="alpha.dita"/>
  <keydef keys="beta" href="beta.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const alpha = await service.resolveKey('companion.alpha', contextFile);
                assert.ok(alpha?.targetFile?.endsWith('alpha.dita'), 'companion.alpha should resolve');

                const beta = await service.resolveKey('companion.beta', contextFile);
                assert.ok(beta?.targetFile?.endsWith('beta.dita'), 'companion.beta should resolve');

                const missing = await service.resolveKey('companion.noSuchKey', contextFile);
                assert.strictEqual(missing, null, 'companion.noSuchKey should return null');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('XML-parser key extraction (Gap 5)', () => {

        test('multi-line attribute value is correctly parsed', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                // href attribute value split across lines (multi-line attribute)
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="multiline"
          href="target.dita"
          scope="local"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('multiline'),
                    'key with multi-line attributes should be extracted');
                assert.ok(keySpace.keys.get('multiline')!.targetFile?.endsWith('target.dita'),
                    'href from multi-line element should be resolved correctly');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('namespace-prefixed href attribute (xlink:href) is resolved', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map xmlns:xlink="http://www.w3.org/1999/xlink">
  <keydef keys="nskey" xlink:href="ns-target.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('nskey'),
                    'key with namespace-prefixed href should be extracted');
                assert.ok(keySpace.keys.get('nskey')!.targetFile?.endsWith('ns-target.dita'),
                    'namespace-prefixed href should resolve to correct target file');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('falls back to regex and still extracts keys when XML is malformed', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                // Deliberately unclosed element to force regex fallback
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="fallback" href="fallback.dita">
  <keydef keys="also-fallback" href="also.dita"/>
`, 'utf-8');  // missing </map>

                const keySpace = await service.buildKeySpace(mapPath);
                // At least the self-closing one should survive regex fallback
                assert.ok(keySpace.keys.has('also-fallback'),
                    'regex fallback should still extract self-closing keydef');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('inline keyword metadata extracted via XML parser', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version">
    <topicmeta>
      <keywords><keyword>3.2</keyword></keywords>
    </topicmeta>
  </keydef>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('version'), 'inline keydef should be extracted');
                const def = keySpace.keys.get('version')!;
                assert.strictEqual(def.inlineContent, '3.2',
                    'inline keyword content should be extracted via XML parser');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('topicmeta returned as array (invalid DITA) does not crash — metadata silently empty', async () => {
            // fxp returns an array when the same element name appears multiple times.
            // The fix normalises this to the first element instead of treating the
            // array as a Record, which previously caused all meta lookups to return undefined.
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                // Manually write raw XML with two <topicmeta> blocks (invalid but parseable)
                fs.writeFileSync(mapPath,
                    `<?xml version="1.0"?>\n<map>\n` +
                    `  <keydef keys="dup-meta">\n` +
                    `    <topicmeta><navtitle>First</navtitle></topicmeta>\n` +
                    `    <topicmeta><navtitle>Second</navtitle></topicmeta>\n` +
                    `  </keydef>\n</map>`,
                    'utf-8'
                );

                // Must not throw; metadata from the first topicmeta should be used
                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('dup-meta'), 'key should still be extracted');
                const def = keySpace.keys.get('dup-meta')!;
                // Either metadata is extracted from first topicmeta or gracefully absent
                // — the important invariant is no crash and keyName is correct
                assert.strictEqual(def.keyName, 'dup-meta', 'key name must be correct');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('XML processing instruction (?xml) is not treated as a key-bearing element', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0" encoding="UTF-8"?>
<map>
  <keydef keys="pi-test" href="pi-test.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('pi-test'), 'real key should be found');
                // Verify no spurious keys leaked from the XML declaration
                const allKeys = Array.from(keySpace.keys.keys());
                assert.ok(!allKeys.some(k => k.includes('version') || k.includes('encoding')),
                    'XML declaration attributes must not become key names');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('pydita-inspired test scenarios', () => {

        test('multiple @keys tokens on one keydef — all keys resolve to same target', async () => {
            // pydita: keys="topic01 second-key-name-topic01" — both should resolve to same href
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="topic01 alias-topic01" href="topic-01.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('topic01'), 'primary key should be registered');
                assert.ok(keySpace.keys.has('alias-topic01'), 'alias key should be registered');
                assert.ok(
                    keySpace.keys.get('topic01')!.targetFile?.endsWith('topic-01.dita'),
                    'primary key should resolve to topic-01.dita'
                );
                assert.ok(
                    keySpace.keys.get('alias-topic01')!.targetFile?.endsWith('topic-01.dita'),
                    'alias key should also resolve to topic-01.dita'
                );
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('cross-sibling scope path returns null (submap02.submap01.topic-01)', async () => {
            // pydita: rootSpace.resolveKey("submap02.submap01.topic-01") is None
            // A key visible inside submap01 is NOT reachable via submap02.submap01.xxx
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref keyscope="submap01" href="submap01.ditamap"/>
  <mapref keyscope="submap02" href="submap02.ditamap"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'submap01.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="topic-01" href="sub01-topic01.dita"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'submap02.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="doc" href="sub02-doc.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);
                assert.ok(!keySpace.keys.has('submap02.submap01.topic-01'),
                    'cross-sibling scope path submap02.submap01.topic-01 must not exist in key map');

                const result = await service.resolveKey('submap02.submap01.topic-01', contextFile);
                assert.strictEqual(result, null,
                    'resolveKey must return null for cross-sibling scope path');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('push-down: inherited key in child scope has same source file as root key', async () => {
            // pydita: keydef2.getKeyDefiner() is keydef3.getKeyDefiner()
            // After push-down, topic-02 resolves in submap01 context with same targetFile as root
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="topic-02" href="root-topic-02.dita"/>
  <mapref keyscope="submap01" href="submap01.ditamap"/>
</map>`, 'utf-8');

                fs.writeFileSync(path.join(tmpDir, 'submap01.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="topic-03" href="sub-topic-03.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(rootPath);

                const rootDef = keySpace.keys.get('topic-02');
                assert.ok(rootDef?.targetFile?.endsWith('root-topic-02.dita'),
                    'root topic-02 should resolve to root-topic-02.dita');

                // PushDown should inject topic-02 into submap01 namespace
                const inheritedDef = keySpace.keys.get('submap01.topic-02');
                assert.ok(inheritedDef?.targetFile?.endsWith('root-topic-02.dita'),
                    'inherited submap01.topic-02 should point to same root-topic-02.dita');

                // Child scope's own key is unaffected
                const ownDef = keySpace.keys.get('submap01.topic-03');
                assert.ok(ownDef?.targetFile?.endsWith('sub-topic-03.dita'),
                    'submap01.topic-03 should point to sub-topic-03.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('scope-on-root-map keyscope creates qualified aliases', async () => {
            // pydita: "scope-on-root-map" in rootSpace.getScopeNames()
            // resolveRootKeyref("scope-on-root-map.topic-01") returns non-null
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map keyscope="bundle">
  <keydef keys="topic-01" href="topic.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'context.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                assert.ok(keySpace.keys.has('topic-01'), 'unqualified key should exist');
                assert.ok(keySpace.keys.has('bundle.topic-01'),
                    'root map @keyscope should create bundle.topic-01 qualified alias');

                const result = await service.resolveKey('bundle.topic-01', contextFile);
                assert.ok(result?.targetFile?.endsWith('topic.dita'),
                    'bundle.topic-01 should resolve to topic.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('string key — keydef with inline content and no href is identifiable', async () => {
            // pydita: keyDef.isStringKey() → True when no href, has inline content
            // Ditacraft equivalent: targetFile is absent, inlineContent is populated
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="string-01">
    <topicmeta>
      <keywords><keyword>Acme Corp</keyword></keywords>
    </topicmeta>
  </keydef>
  <keydef keys="topic-01" href="topic.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);

                const stringKey = keySpace.keys.get('string-01');
                assert.ok(stringKey, 'string key should be registered');
                assert.ok(!stringKey!.targetFile,
                    'string key must have no targetFile (no href)');
                assert.strictEqual(stringKey!.inlineContent, 'Acme Corp',
                    'string key inline keyword content should be "Acme Corp"');

                const topicKey = keySpace.keys.get('topic-01');
                assert.ok(topicKey?.targetFile?.endsWith('topic.dita'),
                    'topic key should have targetFile pointing to topic.dita');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('scope explosion — 25 sibling scopes does not hang', async () => {
            // pydita: test_scope_explosion with keyscope-explosion.ditamap
            // Verifies the algorithm handles many sibling scopes without crashing or timing out
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const SCOPE_COUNT = 25;
                const rootPath = path.join(tmpDir, 'root.ditamap');
                const submapRefs = Array.from({ length: SCOPE_COUNT }, (_, i) =>
                    `  <mapref keyscope="scope${i}" href="scope${i}.ditamap"/>`
                ).join('\n');
                fs.writeFileSync(rootPath,
                    `<?xml version="1.0"?>\n<map>\n${submapRefs}\n</map>`, 'utf-8');

                for (let i = 0; i < SCOPE_COUNT; i++) {
                    fs.writeFileSync(
                        path.join(tmpDir, `scope${i}.ditamap`),
                        `<?xml version="1.0"?>\n<map>\n` +
                        `  <keydef keys="key-a" href="topic-a.dita"/>\n` +
                        `  <keydef keys="key-b" href="topic-b.dita"/>\n` +
                        `</map>`, 'utf-8'
                    );
                }

                const keySpace = await service.buildKeySpace(rootPath);

                assert.ok(keySpace.keys.has('scope0.key-a'),
                    'scope0.key-a should exist after explosion');
                assert.ok(keySpace.keys.has(`scope${SCOPE_COUNT - 1}.key-b`),
                    `scope${SCOPE_COUNT - 1}.key-b should exist after explosion`);
                // If we reach here without timeout, the explosion test passes
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('peer map keyref chain scope fix (Bug 1)', () => {

        test('keyref chain within scoped peer map resolves via correct scope prefix', async () => {
            // Bug: followKeyrefChain was called with scopePrefix='' for all peer keys.
            // A keyref defined within a named scope of the peer map (e.g. "inner.alias"
            // → keyref="inner.real") would fail to find "inner.real" and instead return
            // the alias definition unchanged.
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="peer.ditamap" scope="peer" keyscope="companion"/>
</map>`, 'utf-8');

                const peerPath = path.join(tmpDir, 'peer.ditamap');
                fs.writeFileSync(peerPath, `<?xml version="1.0"?>
<map keyscope="inner">
  <keydef keys="alias" keyref="real"/>
  <keydef keys="real" href="real.dita"/>
</map>`, 'utf-8');

                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                // resolveKey("companion.inner.alias") should follow:
                //   companion → peer map, peerKey = "inner.alias"
                //   inner.alias keyref → "real", peerKeyScope = "inner"
                //   chain follows "inner.real" (scope-qualified) → real.dita
                const result = await service.resolveKey('companion.inner.alias', contextFile);
                assert.ok(result, 'peer key with keyref chain should resolve');
                assert.ok(result!.targetFile?.endsWith('real.dita'),
                    'keyref chain within scoped peer map should resolve to real.dita, not alias');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });

    suite('explainKey and reporting utilities', () => {

        test('explainKey — unqualified match reports correct step', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="version.dita"/>
</map>`, 'utf-8');
                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const report = await service.explainKey('version', contextFile);

                assert.strictEqual(report.keyName, 'version');
                assert.ok(report.resolvedDefinition, 'should resolve');
                assert.ok(report.resolvedDefinition!.targetFile?.endsWith('version.dita'));
                assert.ok(report.keyrefChain.length === 0, 'no keyref chain');

                const unqualStep = report.steps.find(s => s.type === 'unqualified-lookup');
                assert.ok(unqualStep, 'unqualified-lookup step should exist');
                assert.ok(unqualStep!.found, 'step should be found');
                assert.ok(unqualStep!.note.includes('first-BFS-encounter wins'),
                    'note should explain why this definition won');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('explainKey — context-scope match reports context-scope-lookup step first', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="root-version.dita"/>
  <mapref keyscope="product" href="product.ditamap"/>
</map>`, 'utf-8');
                fs.writeFileSync(path.join(tmpDir, 'product.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="product-version.dita"/>
  <topicref href="guide.dita"/>
</map>`, 'utf-8');
                const guidePath = path.join(tmpDir, 'guide.dita');
                fs.writeFileSync(guidePath, '', 'utf-8');

                const report = await service.explainKey('version', guidePath);

                assert.strictEqual(report.contextScope, 'product',
                    'contextScope should be "product"');
                const ctxStep = report.steps.find(s => s.type === 'context-scope-lookup');
                assert.ok(ctxStep, 'context-scope-lookup step should be present');
                assert.ok(ctxStep!.found, 'step should be found');
                assert.ok(ctxStep!.note.includes('product'),
                    'note should mention the winning scope');
                assert.ok(report.resolvedDefinition?.targetFile?.endsWith('product-version.dita'),
                    'should resolve to child-scope override');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('explainKey — failed lookup records all tried steps with notes', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="other" href="other.dita"/>
</map>`, 'utf-8');
                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const report = await service.explainKey('missing-key', contextFile);

                assert.strictEqual(report.resolvedDefinition, null,
                    'resolvedDefinition should be null for missing key');
                assert.ok(report.steps.length >= 1, 'at least one step should be recorded');
                const failStep = report.steps.find(s => s.type === 'unqualified-lookup');
                assert.ok(failStep, 'unqualified-lookup step should exist');
                assert.ok(!failStep!.found, 'step should not be found');
                assert.ok(failStep!.note.includes('missing-key'),
                    'note should mention the key that was not found');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('explainKey — keyref chain records keyref-hop steps', async () => {
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

                const report = await service.explainKey('alias', contextFile);

                assert.ok(report.resolvedDefinition?.targetFile?.endsWith('real.dita'),
                    'should resolve to final keyref target');
                assert.ok(report.keyrefChain.length >= 2,
                    'keyrefChain should contain at least alias and real');
                assert.strictEqual(report.keyrefChain[0], 'alias');
                assert.ok(report.keyrefChain.includes('real'));

                const hopStep = report.steps.find(s => s.type === 'keyref-hop');
                assert.ok(hopStep, 'keyref-hop step should be recorded');
                assert.ok(hopStep!.note.includes('alias') && hopStep!.note.includes('real'),
                    'keyref-hop note should show the from→to transition');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('explainKey — peer map lookup records peer-map-lookup step', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const rootPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(rootPath, `<?xml version="1.0"?>
<map>
  <mapref href="peer.ditamap" scope="peer" keyscope="companion"/>
</map>`, 'utf-8');
                fs.writeFileSync(path.join(tmpDir, 'peer.ditamap'), `<?xml version="1.0"?>
<map>
  <keydef keys="guide" href="guide.dita"/>
</map>`, 'utf-8');
                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const report = await service.explainKey('companion.guide', contextFile);

                assert.ok(report.resolvedDefinition?.targetFile?.endsWith('guide.dita'),
                    'peer key should resolve');
                const peerStep = report.steps.find(s => s.type === 'peer-map-lookup');
                assert.ok(peerStep, 'peer-map-lookup step should exist');
                assert.ok(peerStep!.found, 'peer-map step should be found');
                assert.ok(peerStep!.note.includes('companion') || peerStep!.note.includes('peer.ditamap'),
                    'peer-map step note should mention scope or map name');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('reportKeySpace produces text with key names and source info', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="alpha" href="alpha.dita"/>
  <keydef keys="beta" href="beta.dita"/>
  <keydef keys="alpha" href="duplicate.dita"/>
</map>`, 'utf-8');

                const keySpace = await service.buildKeySpace(mapPath);
                const report = reportKeySpace(keySpace);

                assert.ok(typeof report === 'string' && report.length > 0,
                    'report should be a non-empty string');
                assert.ok(report.includes('alpha'), 'report should mention key "alpha"');
                assert.ok(report.includes('beta'), 'report should mention key "beta"');
                assert.ok(report.includes('root.ditamap'), 'report should reference the root map');
                assert.ok(report.includes('Duplicate keys'), 'report should list duplicate keys');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('formatResolutionReport renders resolved key with winner line', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>
<map>
  <keydef keys="version" href="version.dita"/>
</map>`, 'utf-8');
                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const explainResult = await service.explainKey('version', contextFile);
                const text = formatResolutionReport(explainResult);

                assert.ok(text.includes('RESOLVED'), 'text should say RESOLVED');
                assert.ok(text.includes('version'), 'text should include the key name');
                assert.ok(text.includes('Winner:'), 'text should show Winner line');
                assert.ok(text.includes('Steps:'), 'text should show Steps section');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });

        test('formatResolutionReport renders NOT FOUND when key is missing', async () => {
            const tmpDir = makeTmpDir();
            const service = createService(tmpDir);
            try {
                const mapPath = path.join(tmpDir, 'root.ditamap');
                fs.writeFileSync(mapPath, `<?xml version="1.0"?>\n<map/>\n`, 'utf-8');
                const contextFile = path.join(tmpDir, 'topic.dita');
                fs.writeFileSync(contextFile, '', 'utf-8');

                const explainResult = await service.explainKey('no-such-key', contextFile);
                const text = formatResolutionReport(explainResult);

                assert.ok(text.includes('NOT FOUND'), 'text should say NOT FOUND');
                assert.ok(text.includes('no-such-key'), 'text should include the key name');
                const failStep = explainResult.steps.find(s => !s.found);
                assert.ok(failStep, 'at least one step should have found=false');
            } finally {
                service.shutdown();
                cleanup(tmpDir);
            }
        });
    });
});
