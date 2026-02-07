import * as assert from 'assert';
import { validateDITADocument } from '../src/features/validation';
import { createDoc } from './helper';
import { DitaCraftSettings } from '../src/settings';

function defaultSettings(): DitaCraftSettings {
    return {
        autoValidate: true,
        validationDebounceMs: 300,
        validationEngine: 'typesxml',
        keySpaceCacheTtlMinutes: 5,
        maxLinkMatches: 50,
        maxNumberOfProblems: 100,
        logLevel: 'info',
    };
}

function validate(content: string, uri = 'file:///test.dita') {
    const doc = createDoc(content, uri);
    return validateDITADocument(doc, defaultSettings());
}

suite('validateDITADocument', () => {
    suite('XML well-formedness', () => {
        test('valid XML produces no XML errors', () => {
            const diags = validate(
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>'
            );
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.strictEqual(xmlErrors.length, 0);
        });

        test('malformed XML produces XML error', () => {
            const diags = validate('<topic><title>Unclosed</topic>');
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlErrors.length > 0);
        });

        test('mismatched tags produce XML error', () => {
            const diags = validate('<topic><body></topic></body>');
            const xmlErrors = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlErrors.length > 0);
        });
    });

    suite('DITA structure', () => {
        test('missing DOCTYPE produces warning', () => {
            const diags = validate('<topic id="t1"><title>T</title></topic>');
            const dtDiags = diags.filter(d => d.code === 'DITA-STRUCT-001');
            assert.strictEqual(dtDiags.length, 1);
        });

        test('present DOCTYPE produces no warning', () => {
            const diags = validate(
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>'
            );
            const dtDiags = diags.filter(d => d.code === 'DITA-STRUCT-001');
            assert.strictEqual(dtDiags.length, 0);
        });

        test('missing root topic element produces error', () => {
            const diags = validate('<div><title>T</title></div>');
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.ok(rootDiags.length > 0);
        });

        test('missing id on root element produces error', () => {
            const diags = validate('<topic><title>T</title></topic>');
            const idDiags = diags.filter(d => d.code === 'DITA-STRUCT-003');
            assert.ok(idDiags.length > 0);
        });

        test('root element with id produces no id error', () => {
            const diags = validate('<topic id="t1"><title>T</title></topic>');
            const idDiags = diags.filter(d => d.code === 'DITA-STRUCT-003');
            assert.strictEqual(idDiags.length, 0);
        });

        test('missing title produces error', () => {
            const diags = validate('<topic id="t1"><body><p>No title</p></body></topic>');
            const titleDiags = diags.filter(d => d.code === 'DITA-STRUCT-004');
            assert.ok(titleDiags.length > 0);
        });

        test('present title produces no error', () => {
            const diags = validate('<topic id="t1"><title>T</title></topic>');
            const titleDiags = diags.filter(d => d.code === 'DITA-STRUCT-004');
            assert.strictEqual(titleDiags.length, 0);
        });

        test('empty title element produces warning', () => {
            const diags = validate('<topic id="t1"><title></title></topic>');
            const emptyDiags = diags.filter(d => d.code === 'DITA-STRUCT-005');
            assert.ok(emptyDiags.length > 0);
        });
    });

    suite('Map validation', () => {
        test('valid map produces no root error', () => {
            const diags = validate(
                '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n<map><title>T</title></map>',
                'file:///test.ditamap'
            );
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.strictEqual(rootDiags.length, 0);
        });

        test('map without title produces warning', () => {
            const diags = validate('<map></map>', 'file:///test.ditamap');
            const titleDiags = diags.filter(d => d.code === 'DITA-STRUCT-004');
            assert.ok(titleDiags.length > 0);
        });

        test('missing map root element produces error', () => {
            const diags = validate('<div></div>', 'file:///test.ditamap');
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.ok(rootDiags.length > 0);
        });
    });

    suite('Bookmap validation', () => {
        test('valid bookmap produces no root error', () => {
            const diags = validate('<bookmap></bookmap>', 'file:///test.bookmap');
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.strictEqual(rootDiags.length, 0);
        });

        test('missing bookmap root produces error', () => {
            const diags = validate('<map></map>', 'file:///test.bookmap');
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.ok(rootDiags.length > 0);
        });
    });

    suite('ID validation', () => {
        test('duplicate IDs produce errors', () => {
            const diags = validate(
                '<topic id="t1"><title>T</title><p id="dup"/><p id="dup"/></topic>'
            );
            const dupDiags = diags.filter(d => d.code === 'DITA-ID-001');
            assert.ok(dupDiags.length >= 2);
        });

        test('unique IDs produce no duplicate error', () => {
            const diags = validate(
                '<topic id="t1"><title>T</title><p id="p1"/><p id="p2"/></topic>'
            );
            const dupDiags = diags.filter(d => d.code === 'DITA-ID-001');
            assert.strictEqual(dupDiags.length, 0);
        });

        test('invalid ID format produces warning', () => {
            const diags = validate(
                '<topic id="t1"><title>T</title><p id="1bad"/></topic>'
            );
            const fmtDiags = diags.filter(d => d.code === 'DITA-ID-002');
            assert.ok(fmtDiags.length > 0);
        });

        test('valid ID format produces no format warning', () => {
            const diags = validate(
                '<topic id="t1"><title>T</title><p id="valid_id-1"/></topic>'
            );
            const fmtDiags = diags.filter(d => d.code === 'DITA-ID-002');
            assert.strictEqual(fmtDiags.length, 0);
        });

        test('IDs inside comments are ignored', () => {
            const diags = validate(
                '<topic id="t1"><title>T</title><!-- <p id="dup"/> --><p id="dup"/></topic>'
            );
            const dupDiags = diags.filter(d => d.code === 'DITA-ID-001');
            assert.strictEqual(dupDiags.length, 0);
        });
    });

    suite('DITAVAL validation', () => {
        test('valid ditaval produces no root error', () => {
            const diags = validate(
                '<val><prop att="audience" val="admin" action="include"/></val>',
                'file:///test.ditaval'
            );
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.strictEqual(rootDiags.length, 0);
        });

        test('missing val root produces error', () => {
            const diags = validate(
                '<prop att="audience" val="admin" action="include"/>',
                'file:///test.ditaval'
            );
            const rootDiags = diags.filter(d => d.code === 'DITA-STRUCT-002');
            assert.ok(rootDiags.length > 0);
            assert.ok(rootDiags[0].message.includes('<val>'));
        });

        test('ditaval skips DOCTYPE warning', () => {
            const diags = validate(
                '<val><prop att="platform" val="linux" action="exclude"/></val>',
                'file:///test.ditaval'
            );
            const doctypeDiags = diags.filter(d => d.code === 'DITA-STRUCT-001');
            assert.strictEqual(doctypeDiags.length, 0);
        });

        test('ditaval skips title warning', () => {
            const diags = validate(
                '<val></val>',
                'file:///test.ditaval'
            );
            const titleDiags = diags.filter(d => d.code === 'DITA-STRUCT-004');
            assert.strictEqual(titleDiags.length, 0);
        });

        test('ditaval still validates XML well-formedness', () => {
            const diags = validate(
                '<val><prop></val>',
                'file:///test.ditaval'
            );
            const xmlDiags = diags.filter(d => d.code === 'DITA-XML-001');
            assert.ok(xmlDiags.length > 0);
        });
    });

    suite('Empty element variations', () => {
        test('empty <p> produces warning', () => {
            const diags = validate('<topic id="t1"><title>T</title><body><p></p></body></topic>');
            const emptyDiags = diags.filter(d => d.code === 'DITA-STRUCT-005' && d.message.includes('<p>'));
            assert.ok(emptyDiags.length > 0);
        });

        test('empty <shortdesc> produces warning', () => {
            const diags = validate('<topic id="t1"><title>T</title><shortdesc></shortdesc></topic>');
            const emptyDiags = diags.filter(d => d.code === 'DITA-STRUCT-005' && d.message.includes('<shortdesc>'));
            assert.ok(emptyDiags.length > 0);
        });
    });

    suite('Root element id edge cases', () => {
        test('empty id attribute produces error', () => {
            const diags = validate('<topic id=""><title>T</title></topic>');
            const idDiags = diags.filter(d => d.code === 'DITA-STRUCT-003');
            assert.ok(idDiags.length > 0);
            assert.ok(idDiags[0].message.includes('cannot be empty'));
        });
    });

    suite('Max problems cap', () => {
        test('diagnostics are capped at maxNumberOfProblems', () => {
            const settings = defaultSettings();
            settings.maxNumberOfProblems = 2;
            const doc = createDoc('<topic><title>T</title><p id="dup1"/><p id="dup1"/><p id="dup2"/><p id="dup2"/></topic>');
            const diags = validateDITADocument(doc, settings);
            assert.ok(diags.length <= 2);
        });
    });
});
