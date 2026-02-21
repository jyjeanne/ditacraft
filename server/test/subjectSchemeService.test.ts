import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';

function createTmpScheme(content: string): { dir: string; filePath: string } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-scheme-'));
    const filePath = path.join(dir, 'scheme.ditamap');
    fs.writeFileSync(filePath, content, 'utf-8');
    return { dir, filePath };
}

function cleanup(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

suite('SubjectSchemeService', () => {
    suite('parseSubjectScheme', () => {
        test('parses basic subject scheme with enumeration', () => {
            const scheme = `<?xml version="1.0"?>
<subjectScheme>
  <subjectdef keys="os">
    <subjectdef keys="linux"/>
    <subjectdef keys="windows"/>
    <subjectdef keys="macos"/>
  </subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);

                assert.ok(data.validValuesMap.has('platform'));
                const platformValues = data.validValuesMap.get('platform')!.get('*')!;
                assert.ok(platformValues.has('linux'));
                assert.ok(platformValues.has('windows'));
                assert.ok(platformValues.has('macos'));
                // The parent 'os' key should also be collected
                assert.ok(platformValues.has('os'));
            } finally {
                cleanup(dir);
            }
        });

        test('parses enumeration with element-specific binding', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="audiences">
    <subjectdef keys="admin"/>
    <subjectdef keys="user"/>
  </subjectdef>
  <enumerationdef>
    <elementdef name="section"/>
    <attributedef name="audience"/>
    <subjectdef keyref="audiences"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);

                const audienceMap = data.validValuesMap.get('audience')!;
                assert.ok(audienceMap.has('section'));
                const sectionValues = audienceMap.get('section')!;
                assert.ok(sectionValues.has('admin'));
                assert.ok(sectionValues.has('user'));
            } finally {
                cleanup(dir);
            }
        });

        test('parses default subject', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="platforms">
    <subjectdef keys="linux"/>
    <subjectdef keys="windows"/>
  </subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="platforms"/>
    <defaultSubject keyref="linux"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);

                assert.ok(data.defaultValueMap.has('platform'));
                assert.strictEqual(data.defaultValueMap.get('platform')!.get('*'), 'linux');
            } finally {
                cleanup(dir);
            }
        });

        test('handles nested subject definitions', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os">
    <subjectdef keys="unix">
      <subjectdef keys="linux"/>
      <subjectdef keys="freebsd"/>
    </subjectdef>
    <subjectdef keys="windows"/>
  </subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);

                const values = data.validValuesMap.get('platform')!.get('*')!;
                assert.ok(values.has('os'));
                assert.ok(values.has('unix'));
                assert.ok(values.has('linux'));
                assert.ok(values.has('freebsd'));
                assert.ok(values.has('windows'));
            } finally {
                cleanup(dir);
            }
        });

        test('handles missing file gracefully', () => {
            const service = new SubjectSchemeService();
            const data = service.parseSubjectScheme('/nonexistent/path/scheme.ditamap');

            assert.strictEqual(data.validValuesMap.size, 0);
            assert.strictEqual(data.defaultValueMap.size, 0);
        });

        test('handles empty scheme gracefully', () => {
            const scheme = `<subjectScheme></subjectScheme>`;
            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);
                assert.strictEqual(data.validValuesMap.size, 0);
            } finally {
                cleanup(dir);
            }
        });

        test('caches parsed results', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="vals"><subjectdef keys="a"/></subjectdef>
  <enumerationdef>
    <attributedef name="props"/>
    <subjectdef keyref="vals"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data1 = service.parseSubjectScheme(filePath);
                const data2 = service.parseSubjectScheme(filePath);
                // Should return the same cached object
                assert.strictEqual(data1, data2);
            } finally {
                cleanup(dir);
            }
        });

        test('skips enumerationdef without attributedef', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="vals"><subjectdef keys="a"/></subjectdef>
  <enumerationdef>
    <subjectdef keyref="vals"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);
                assert.strictEqual(data.validValuesMap.size, 0);
            } finally {
                cleanup(dir);
            }
        });

        test('handles direct key references not in subject tree', () => {
            const scheme = `<subjectScheme>
  <enumerationdef>
    <attributedef name="audience"/>
    <subjectdef keyref="admin"/>
    <subjectdef keyref="developer"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);
                const values = data.validValuesMap.get('audience')!.get('*')!;
                assert.ok(values.has('admin'));
                assert.ok(values.has('developer'));
            } finally {
                cleanup(dir);
            }
        });

        test('parses subjectdef with navtitle attribute', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="products" navtitle="Products">
    <subjectdef keys="acme" navtitle="Acme Widget"/>
    <subjectdef keys="beta" navtitle="Beta Tool"/>
  </subjectdef>
  <enumerationdef>
    <attributedef name="product"/>
    <subjectdef keyref="products"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);
                const values = data.validValuesMap.get('product')!.get('*')!;
                assert.ok(values.has('acme'));
                assert.ok(values.has('beta'));
            } finally {
                cleanup(dir);
            }
        });
    });

    suite('registerSchemes and getMergedSchemeData', () => {
        test('merges multiple scheme files', () => {
            const scheme1 = `<subjectScheme>
  <subjectdef keys="platforms"><subjectdef keys="linux"/><subjectdef keys="windows"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="platforms"/>
  </enumerationdef>
</subjectScheme>`;

            const scheme2 = `<subjectScheme>
  <subjectdef keys="audiences"><subjectdef keys="admin"/><subjectdef keys="user"/></subjectdef>
  <enumerationdef>
    <attributedef name="audience"/>
    <subjectdef keyref="audiences"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp1 = createTmpScheme(scheme1);
            const tmp2 = createTmpScheme(scheme2);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp1.filePath, tmp2.filePath]);
                const merged = service.getMergedSchemeData();

                assert.ok(merged.validValuesMap.has('platform'));
                assert.ok(merged.validValuesMap.has('audience'));

                const platformValues = merged.validValuesMap.get('platform')!.get('*')!;
                assert.ok(platformValues.has('linux'));
                assert.ok(platformValues.has('windows'));

                const audienceValues = merged.validValuesMap.get('audience')!.get('*')!;
                assert.ok(audienceValues.has('admin'));
                assert.ok(audienceValues.has('user'));
            } finally {
                cleanup(tmp1.dir);
                cleanup(tmp2.dir);
            }
        });

        test('registerSchemes clears merged cache on change', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="vals"><subjectdef keys="a"/></subjectdef>
  <enumerationdef>
    <attributedef name="props"/>
    <subjectdef keyref="vals"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);
                const merged1 = service.getMergedSchemeData();

                // Re-register same paths — should return cached
                service.registerSchemes([tmp.filePath]);
                const merged2 = service.getMergedSchemeData();
                assert.strictEqual(merged1, merged2, 'same paths should return cached merged data');

                // Register different paths — should clear cache
                service.registerSchemes([]);
                const merged3 = service.getMergedSchemeData();
                assert.notStrictEqual(merged1, merged3, 'different paths should force re-merge');
            } finally {
                cleanup(tmp.dir);
            }
        });
    });

    suite('getValidValues', () => {
        test('returns values for wildcard element', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os"><subjectdef keys="linux"/><subjectdef keys="windows"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);

                const values = service.getValidValues('platform');
                assert.ok(values);
                assert.ok(values.has('linux'));
                assert.ok(values.has('windows'));
            } finally {
                cleanup(tmp.dir);
            }
        });

        test('returns element-specific values when available', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="auds"><subjectdef keys="admin"/><subjectdef keys="user"/></subjectdef>
  <enumerationdef>
    <elementdef name="p"/>
    <attributedef name="audience"/>
    <subjectdef keyref="auds"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);

                const pValues = service.getValidValues('audience', 'p');
                assert.ok(pValues);
                assert.ok(pValues.has('admin'));

                // Other elements should not match (no wildcard)
                const divValues = service.getValidValues('audience', 'div');
                assert.strictEqual(divValues, null);
            } finally {
                cleanup(tmp.dir);
            }
        });

        test('returns null for uncontrolled attribute', () => {
            const service = new SubjectSchemeService();
            service.registerSchemes([]);
            const values = service.getValidValues('class');
            assert.strictEqual(values, null);
        });
    });

    suite('isControlledAttribute', () => {
        test('returns true for controlled attributes', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os"><subjectdef keys="linux"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);
                assert.ok(service.isControlledAttribute('platform'));
                assert.ok(!service.isControlledAttribute('audience'));
            } finally {
                cleanup(tmp.dir);
            }
        });
    });

    suite('hasSchemeData', () => {
        test('returns false when no schemes registered', () => {
            const service = new SubjectSchemeService();
            assert.ok(!service.hasSchemeData());
        });

        test('returns true when schemes registered', () => {
            const scheme = `<subjectScheme></subjectScheme>`;
            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);
                assert.ok(service.hasSchemeData());
            } finally {
                cleanup(tmp.dir);
            }
        });
    });

    suite('invalidate and shutdown', () => {
        test('invalidate clears specific file cache', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os"><subjectdef keys="linux"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);
                const data1 = service.getMergedSchemeData();

                service.invalidate(tmp.filePath);
                const data2 = service.getMergedSchemeData();
                assert.notStrictEqual(data1, data2, 'should re-parse after invalidation');
            } finally {
                cleanup(tmp.dir);
            }
        });

        test('shutdown clears all state', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os"><subjectdef keys="linux"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
</subjectScheme>`;

            const tmp = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                service.registerSchemes([tmp.filePath]);
                assert.ok(service.hasSchemeData());

                service.shutdown();
                assert.ok(!service.hasSchemeData());
            } finally {
                cleanup(tmp.dir);
            }
        });
    });

    suite('multiple enumerations in one scheme', () => {
        test('parses multiple enumerationdefs', () => {
            const scheme = `<subjectScheme>
  <subjectdef keys="os"><subjectdef keys="linux"/><subjectdef keys="windows"/></subjectdef>
  <subjectdef keys="auds"><subjectdef keys="admin"/><subjectdef keys="user"/></subjectdef>
  <enumerationdef>
    <attributedef name="platform"/>
    <subjectdef keyref="os"/>
  </enumerationdef>
  <enumerationdef>
    <attributedef name="audience"/>
    <subjectdef keyref="auds"/>
  </enumerationdef>
</subjectScheme>`;

            const { dir, filePath } = createTmpScheme(scheme);
            try {
                const service = new SubjectSchemeService();
                const data = service.parseSubjectScheme(filePath);

                assert.ok(data.validValuesMap.has('platform'));
                assert.ok(data.validValuesMap.has('audience'));

                const platformValues = data.validValuesMap.get('platform')!.get('*')!;
                assert.ok(platformValues.has('linux'));
                assert.ok(platformValues.has('windows'));

                const audienceValues = data.validValuesMap.get('audience')!.get('*')!;
                assert.ok(audienceValues.has('admin'));
                assert.ok(audienceValues.has('user'));
            } finally {
                cleanup(dir);
            }
        });
    });
});
