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
});
