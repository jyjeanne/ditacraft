import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { validateProfilingAttributes, PROFILING_CODES } from '../src/features/profilingValidation';
import { SubjectSchemeService } from '../src/services/subjectSchemeService';

function createSchemeService(schemeContent: string): { service: SubjectSchemeService; cleanup: () => void } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-prof-'));
    const filePath = path.join(dir, 'scheme.ditamap');
    fs.writeFileSync(filePath, schemeContent, 'utf-8');

    const service = new SubjectSchemeService();
    service.registerSchemes([filePath]);

    return {
        service,
        cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
    };
}

const PLATFORM_SCHEME = `<subjectScheme>
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

suite('validateProfilingAttributes', () => {
    test('valid profiling value produces no warning', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<p platform="linux">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 0);
        } finally {
            cleanup();
        }
    });

    test('invalid profiling value produces warning', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<p platform="solaris">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 1);
            assert.ok(profDiags[0].message.includes('solaris'));
            assert.ok(profDiags[0].message.includes('platform'));
        } finally {
            cleanup();
        }
    });

    test('space-separated values: one invalid', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<p platform="linux solaris">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 1);
            assert.ok(profDiags[0].message.includes('solaris'));
        } finally {
            cleanup();
        }
    });

    test('space-separated values: all valid', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<p platform="linux windows">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 0);
        } finally {
            cleanup();
        }
    });

    test('uncontrolled attribute is not validated', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            // audience is not controlled in this scheme
            const text = '<p audience="admin">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            assert.strictEqual(diags.length, 0);
        } finally {
            cleanup();
        }
    });

    test('no scheme data produces no diagnostics', () => {
        const service = new SubjectSchemeService();
        const text = '<p platform="anything">text</p>';
        const diags = validateProfilingAttributes(text, service, 100);
        assert.strictEqual(diags.length, 0);
    });

    test('profiling values inside comments are ignored', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<!-- <p platform="invalid">text</p> -->';
            const diags = validateProfilingAttributes(text, service, 100);
            assert.strictEqual(diags.length, 0);
        } finally {
            cleanup();
        }
    });

    test('maxProblems caps results', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const lines = Array.from({ length: 10 }, (_, i) =>
                `<p platform="invalid${i}">text</p>`
            ).join('\n');
            const diags = validateProfilingAttributes(lines, service, 3);
            assert.ok(diags.length <= 3, `Expected <= 3, got ${diags.length}`);
        } finally {
            cleanup();
        }
    });

    test('diagnostic range points to correct line', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<topic id="t1">\n<p platform="solaris">text</p>\n</topic>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 1);
            assert.strictEqual(profDiags[0].range.start.line, 1);
        } finally {
            cleanup();
        }
    });

    test('multiple profiling attributes in same document', () => {
        const multiScheme = `<subjectScheme>
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

        const { service, cleanup } = createSchemeService(multiScheme);
        try {
            const text = '<p platform="solaris" audience="guest">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 2);
            const messages = profDiags.map(d => d.message);
            assert.ok(messages.some(m => m.includes('solaris')));
            assert.ok(messages.some(m => m.includes('guest')));
        } finally {
            cleanup();
        }
    });

    test('valid values message lists allowed values', () => {
        const { service, cleanup } = createSchemeService(PLATFORM_SCHEME);
        try {
            const text = '<p platform="solaris">text</p>';
            const diags = validateProfilingAttributes(text, service, 100);
            const profDiags = diags.filter(d => d.code === PROFILING_CODES.INVALID_VALUE);
            assert.strictEqual(profDiags.length, 1);
            assert.ok(profDiags[0].message.includes('linux'));
            assert.ok(profDiags[0].message.includes('windows'));
            assert.ok(profDiags[0].message.includes('macos'));
        } finally {
            cleanup();
        }
    });
});
