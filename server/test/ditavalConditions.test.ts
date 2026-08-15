import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { handleGetSubjectSchemeAttributes } from '../src/features/ditavalConditions';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';
import { KeySpaceService } from '../src/services/keySpaceService';

function createKeySpaceService(tmpDir: string): KeySpaceService {
    return new KeySpaceService(
        [tmpDir],
        async () => ({ keySpaceCacheTtlMinutes: 5, maxLinkMatches: 10000 }),
        () => {}
    );
}

// Enumerationdefs reference leaf keys directly (`keyref="internal external"`)
// rather than a whole group node (`keyref="aud"`) -- SubjectSchemeService's
// existing, established flattenKeys() includes a referenced group node's
// own key alongside its children (e.g. "aud" itself, not just "internal"/
// "external"), which is correct, pre-existing behavior this feature reuses
// as-is rather than changes. Referencing leaves directly keeps these
// enumeration-test expectations focused on merge/hierarchy-path behavior.
const AUDIENCE_SCHEME = `<subjectScheme>
  <subjectdef keys="aud">
    <subjectdef keys="internal" navtitle="Internal"/>
    <subjectdef keys="external" navtitle="External"/>
  </subjectdef>
  <subjectdef keys="os">
    <subjectdef keys="linux" navtitle="Linux">
      <subjectdef keys="ubuntu" navtitle="Ubuntu"/>
    </subjectdef>
  </subjectdef>
  <enumerationdef>
    <attributedef name="audience"/>
    <subjectdef keyref="internal external"/>
  </enumerationdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="ubuntu"/>
  </enumerationdef>
</subjectScheme>`;

suite('handleGetSubjectSchemeAttributes', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ditavalconditions-test-'));
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('returns an empty attribute list when no keySpaceService is available', async () => {
        const service = new SubjectSchemeService();
        const result = await handleGetSubjectSchemeAttributes(
            { contextUri: URI.file(path.join(tmpDir, 'filter.ditaval')).toString() },
            service,
            undefined
        );
        assert.deepStrictEqual(result, { attributes: [] });
    });

    test('returns an empty attribute list when the context file has no discoverable subject scheme', async () => {
        const service = new SubjectSchemeService();
        const keySpaceService = createKeySpaceService(tmpDir);
        try {
            const contextPath = path.join(tmpDir, 'filter.ditaval');
            fs.writeFileSync(contextPath, '<val/>');

            const result = await handleGetSubjectSchemeAttributes(
                { contextUri: URI.file(contextPath).toString() },
                service,
                keySpaceService
            );
            assert.deepStrictEqual(result, { attributes: [] });
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('enumerates every controlled attribute/value pair from a discovered subject scheme, with hierarchy paths', async () => {
        fs.writeFileSync(path.join(tmpDir, 'scheme.ditamap'), AUDIENCE_SCHEME, 'utf-8');
        fs.writeFileSync(
            path.join(tmpDir, 'root.ditamap'),
            `<?xml version="1.0"?><map><mapref href="scheme.ditamap"/></map>`,
            'utf-8'
        );
        const contextPath = path.join(tmpDir, 'filter.ditaval');
        fs.writeFileSync(contextPath, '<val/>');

        const service = new SubjectSchemeService();
        const keySpaceService = createKeySpaceService(tmpDir);
        try {
            const result = await handleGetSubjectSchemeAttributes(
                { contextUri: URI.file(contextPath).toString() },
                service,
                keySpaceService
            );

            assert.strictEqual(result.attributes.length, 2);
            const [audience, platform] = result.attributes; // sorted alphabetically
            assert.strictEqual(audience.attribute, 'audience');
            assert.deepStrictEqual(
                audience.values.map(v => v.value).sort(),
                ['external', 'internal']
            );
            assert.strictEqual(platform.attribute, 'platform');
            assert.deepStrictEqual(platform.values.map(v => v.value), ['ubuntu']);
            assert.strictEqual(platform.values[0].hierarchyPath, 'os > Linux > Ubuntu');
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('merges element-scoped value buckets into one deduplicated list per attribute', async () => {
        const elementScopedScheme = `<subjectScheme>
  <subjectdef keys="aud">
    <subjectdef keys="internal"/>
    <subjectdef keys="admin"/>
  </subjectdef>
  <enumerationdef>
    <elementdef name="task"/>
    <attributedef name="audience"/>
    <subjectdef keyref="internal admin"/>
  </enumerationdef>
  <enumerationdef>
    <elementdef name="topic"/>
    <attributedef name="audience"/>
    <subjectdef keyref="internal"/>
  </enumerationdef>
</subjectScheme>`;
        fs.writeFileSync(path.join(tmpDir, 'scheme.ditamap'), elementScopedScheme, 'utf-8');
        fs.writeFileSync(
            path.join(tmpDir, 'root.ditamap'),
            `<?xml version="1.0"?><map><mapref href="scheme.ditamap"/></map>`,
            'utf-8'
        );
        const contextPath = path.join(tmpDir, 'filter.ditaval');
        fs.writeFileSync(contextPath, '<val/>');

        const service = new SubjectSchemeService();
        const keySpaceService = createKeySpaceService(tmpDir);
        try {
            const result = await handleGetSubjectSchemeAttributes(
                { contextUri: URI.file(contextPath).toString() },
                service,
                keySpaceService
            );

            assert.strictEqual(result.attributes.length, 1);
            // "internal" appears in both the task-scoped and topic-scoped
            // buckets -- must be deduplicated, not listed twice.
            assert.deepStrictEqual(
                result.attributes[0].values.map(v => v.value).sort(),
                ['admin', 'internal']
            );
        } finally {
            keySpaceService.shutdown();
        }
    });

    test('includes a referenced group node\'s own key alongside its children (documents existing SubjectSchemeService behavior, not new for this feature)', async () => {
        fs.writeFileSync(path.join(tmpDir, 'scheme.ditamap'), AUDIENCE_SCHEME.replace('keyref="internal external"', 'keyref="aud"'), 'utf-8');
        fs.writeFileSync(
            path.join(tmpDir, 'root.ditamap'),
            `<?xml version="1.0"?><map><mapref href="scheme.ditamap"/></map>`,
            'utf-8'
        );
        const contextPath = path.join(tmpDir, 'filter.ditaval');
        fs.writeFileSync(contextPath, '<val/>');

        const service = new SubjectSchemeService();
        const keySpaceService = createKeySpaceService(tmpDir);
        try {
            const result = await handleGetSubjectSchemeAttributes(
                { contextUri: URI.file(contextPath).toString() },
                service,
                keySpaceService
            );

            const audience = result.attributes.find(a => a.attribute === 'audience');
            assert.ok(audience);
            assert.deepStrictEqual(audience!.values.map(v => v.value).sort(), ['aud', 'external', 'internal']);
        } finally {
            keySpaceService.shutdown();
        }
    });
});
