import * as assert from 'assert';
import { detectDitaVersion } from '../src/utils/ditaVersionDetector';

suite('detectDitaVersion', () => {
    suite('DITAArchVersion attribute', () => {
        test('detects 1.3 from DITAArchVersion attribute', () => {
            const text = '<topic id="t1" xmlns:ditaarch="http://dita.oasis-open.org/architecture/2005/" ditaarch:DITAArchVersion="1.3"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });

        test('detects 1.2 from DITAArchVersion attribute', () => {
            const text = '<topic id="t1" ditaarch:DITAArchVersion="1.2"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });

        test('detects 1.1 from DITAArchVersion attribute', () => {
            const text = '<topic id="t1" DITAArchVersion="1.1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.1');
        });

        test('detects 1.0 from DITAArchVersion attribute', () => {
            const text = '<topic id="t1" DITAArchVersion="1.0"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.0');
        });

        test('detects 2.0 from DITAArchVersion attribute', () => {
            const text = '<topic id="t1" DITAArchVersion="2.0"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '2.0');
        });

        test('detects 2.x variants as 2.0', () => {
            const text = '<topic id="t1" DITAArchVersion="2.1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '2.0');
        });

        test('handles single quotes', () => {
            const text = "<topic id='t1' DITAArchVersion='1.2'><title>T</title></topic>";
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });

        test('handles whitespace around equals', () => {
            const text = '<topic id="t1" DITAArchVersion = "1.2"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });
    });

    suite('DOCTYPE detection', () => {
        test('detects 1.3 from DOCTYPE public identifier', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.3 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });

        test('detects 1.2 from DOCTYPE public identifier', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.2 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });

        test('detects 1.1 from DOCTYPE public identifier', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.1 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.1');
        });

        test('detects 1.0 from DOCTYPE public identifier', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.0 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.0');
        });

        test('detects 2.0 from DOCTYPE public identifier', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 2.0 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '2.0');
        });

        test('handles concept DOCTYPE', () => {
            const text = '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.2 Concept//EN" "concept.dtd">\n<concept id="c1"><title>C</title></concept>';
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });
    });

    suite('DITAArchVersion takes precedence over DOCTYPE', () => {
        test('attribute wins over DOCTYPE', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.2 Topic//EN" "topic.dtd">\n<topic id="t1" DITAArchVersion="1.3"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });
    });

    suite('default', () => {
        test('defaults to 1.3 with no version info', () => {
            const text = '<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });

        test('defaults to 1.3 for empty document', () => {
            assert.strictEqual(detectDitaVersion(''), '1.3');
        });

        test('defaults to 1.3 for DOCTYPE without version', () => {
            const text = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });

        test('defaults to 1.3 for unknown DITAArchVersion', () => {
            const text = '<topic id="t1" DITAArchVersion="9.9"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.3');
        });
    });

    suite('with XML declaration', () => {
        test('handles XML declaration before DOCTYPE', () => {
            const text = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA 1.2 Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            assert.strictEqual(detectDitaVersion(text), '1.2');
        });
    });
});
