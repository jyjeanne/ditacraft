import * as assert from 'assert';
import {
    validateDitaRules,
    DitaRulesSettings,
} from '../src/features/ditaRulesValidator';

const DEFAULT_SETTINGS: DitaRulesSettings = {
    enabled: true,
    categories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    ditaVersion: '1.3',
};

function validate(text: string, settings?: Partial<DitaRulesSettings>) {
    return validateDitaRules(text, { ...DEFAULT_SETTINGS, ...settings });
}

suite('validateDitaRules', () => {
    suite('Configuration', () => {
        test('disabled rules return empty', () => {
            const text = '<indextermref/>';
            const diags = validate(text, { enabled: false });
            assert.strictEqual(diags.length, 0);
        });

        test('category filtering excludes rules', () => {
            const text = '<indextermref/>';
            // Only run recommendation — should skip mandatory DITA-SCH-003
            const diags = validate(text, { categories: ['recommendation'] });
            const sch003 = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(sch003.length, 0);
        });

        test('version filtering excludes rules', () => {
            // SCH-014 only applies to DITA 1.2
            const text = '<topicref navtitle="Test" href="test.dita"/>';
            const diags12 = validate(text, { ditaVersion: '1.2' });
            const diags13 = validate(text, { ditaVersion: '1.3' });
            const sch014_12 = diags12.filter(d => d.code === 'DITA-SCH-014');
            const sch014_13 = diags13.filter(d => d.code === 'DITA-SCH-014');
            assert.strictEqual(sch014_12.length, 1, 'should fire on DITA 1.2');
            assert.strictEqual(sch014_13.length, 0, 'should NOT fire on DITA 1.3');
        });
    });

    suite('Mandatory rules', () => {
        test('DITA-SCH-001: role="other" without otherrole', () => {
            const text = '<othermeta role="other" name="test"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-001');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('otherrole'));
        });

        test('DITA-SCH-001: role="other" with otherrole is OK', () => {
            const text = '<othermeta role="other" otherrole="custom" name="test"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-001');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-002: note type="other" without othertype', () => {
            const text = '<note type="other">Some note</note>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-002');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('othertype'));
        });

        test('DITA-SCH-002: note type="other" with othertype is OK', () => {
            const text = '<note type="other" othertype="custom">Some note</note>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-002');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-003: deprecated <indextermref>', () => {
            const text = '<topic id="t1"><body><indextermref keyref="k1"/></body></topic>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('deprecated'));
        });

        test('DITA-SCH-004: collection-type on reltable', () => {
            const text = '<reltable collection-type="family"><relrow/></reltable>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-004');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-004: collection-type on relcolspec', () => {
            const text = '<relcolspec collection-type="family"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-004');
            assert.strictEqual(matches.length, 1);
        });
    });

    suite('Recommendation rules', () => {
        test('DITA-SCH-010: deprecated <boolean>', () => {
            const text = '<topic id="t1"><body><boolean state="yes"/></body></topic>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-010');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('deprecated'));
        });

        test('DITA-SCH-011: deprecated @alt on <image>', () => {
            const text = '<image href="pic.png" alt="description"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-011');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-012: deprecated @longdescref on <image>', () => {
            const text = '<image href="pic.png" longdescref="desc.dita"><alt>alt</alt></image>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-012');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-013: deprecated @query on <link>', () => {
            const text = '<link href="test.dita" query="foo=bar"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-013');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-015: deprecated @title on <map> (DITA 1.2)', () => {
            const text = '<map title="My Map"><topicref href="t.dita"/></map>';
            const diags = validate(text, { ditaVersion: '1.2' });
            const matches = diags.filter(d => d.code === 'DITA-SCH-015');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-016: long shortdesc (>= 50 words)', () => {
            const words = Array.from({ length: 55 }, (_, i) => `word${i}`).join(' ');
            const text = `<shortdesc>${words}</shortdesc>`;
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-016');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('55'));
        });

        test('DITA-SCH-016: short shortdesc is OK', () => {
            const text = '<shortdesc>This is a short description.</shortdesc>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-016');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-017: topichead without navtitle', () => {
            const text = '<topichead><topicref href="t.dita"/></topichead>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-017');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-017: topichead with navtitle attribute is OK', () => {
            const text = '<topichead navtitle="Section"><topicref href="t.dita"/></topichead>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-017');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-017: topichead with <navtitle> element is OK', () => {
            const text = '<topichead><topicmeta><navtitle>Section</navtitle></topicmeta></topichead>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-017');
            assert.strictEqual(matches.length, 0);
        });
    });

    suite('Authoring rules', () => {
        test('DITA-SCH-020: xref inside title', () => {
            const text = '<title>See <xref href="other.dita">here</xref></title>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-020');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('title'));
        });

        test('DITA-SCH-020: title without xref is OK', () => {
            const text = '<title>Normal title</title>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-020');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-021: required-cleanup present', () => {
            const text = '<topic id="t1"><body><required-cleanup>todo</required-cleanup></body></topic>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-021');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('cleaned up'));
        });

        test('DITA-SCH-022: trademark character in text', () => {
            const text = '<p>Acme\u2122 is great</p>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-022');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('trademark'));
        });

        test('DITA-SCH-022: trademark inside tag attribute is OK', () => {
            const text = '<data value="Acme\u2122"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-022');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-023: multiple titles in section', () => {
            const text = '<section><title>One</title><title>Two</title></section>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-023');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('2'));
        });

        test('DITA-SCH-023: single title in section is OK', () => {
            const text = '<section><title>One</title><p>text</p></section>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-023');
            assert.strictEqual(matches.length, 0);
        });
    });

    suite('Accessibility rules', () => {
        test('DITA-SCH-030: image without alt text', () => {
            const text = '<image href="photo.png"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-030');
            assert.strictEqual(matches.length, 1);
            assert.ok(matches[0].message.includes('alternative text'));
        });

        test('DITA-SCH-030: image with @alt attribute is OK', () => {
            const text = '<image href="photo.png" alt="A photo"/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-030');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-030: image with <alt> element is OK', () => {
            const text = '<image href="photo.png"><alt>A photo</alt></image>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-030');
            assert.strictEqual(matches.length, 0);
        });

        test('DITA-SCH-031: object without desc', () => {
            const text = '<object data="video.mp4"><param name="autoplay" value="true"/></object>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-031');
            assert.strictEqual(matches.length, 1);
        });

        test('DITA-SCH-031: object with desc is OK', () => {
            const text = '<object data="video.mp4"><desc>A video</desc></object>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-031');
            assert.strictEqual(matches.length, 0);
        });
    });

    suite('Diagnostic range accuracy', () => {
        test('diagnostic points to correct line', () => {
            const text = 'line0\n<indextermref/>\nline2';
            const diags = validate(text);
            const match = diags.find(d => d.code === 'DITA-SCH-003');
            assert.ok(match);
            assert.strictEqual(match.range.start.line, 1);
            assert.strictEqual(match.range.start.character, 0);
        });

        test('CRLF line endings produce correct positions', () => {
            const text = 'line0\r\n<indextermref/>\r\nline2';
            const diags = validate(text);
            const match = diags.find(d => d.code === 'DITA-SCH-003');
            assert.ok(match);
            assert.strictEqual(match.range.start.line, 1);
            assert.strictEqual(match.range.start.character, 0);
        });

        test('multiple rules can fire on the same document', () => {
            const text =
                '<topic id="t1">\n' +
                '<body>\n' +
                '<indextermref keyref="k1"/>\n' +
                '<boolean state="yes"/>\n' +
                '<image href="pic.png"/>\n' +
                '</body>\n' +
                '</topic>';
            const diags = validate(text);
            const codes = new Set(diags.map(d => d.code));
            assert.ok(codes.has('DITA-SCH-003'), 'should fire SCH-003 for indextermref');
            assert.ok(codes.has('DITA-SCH-010'), 'should fire SCH-010 for boolean');
            assert.ok(codes.has('DITA-SCH-030'), 'should fire SCH-030 for image');
        });
    });

    suite('Comment and CDATA stripping', () => {
        test('rules do not fire on content inside comments', () => {
            const text = '<!-- <indextermref/> -->';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(matches.length, 0);
        });

        test('rules do not fire on content inside CDATA', () => {
            const text = '<![CDATA[<indextermref/>]]>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(matches.length, 0);
        });

        test('rules still fire on content outside comments', () => {
            const text = '<!-- safe -->\n<indextermref/>';
            const diags = validate(text);
            const matches = diags.filter(d => d.code === 'DITA-SCH-003');
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0].range.start.line, 1);
        });
    });
});
