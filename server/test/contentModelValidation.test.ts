import * as assert from 'assert';
import { validateContentModel } from '../src/features/contentModelValidation';
import { DiagnosticSeverity } from 'vscode-languageserver/node';

suite('Content Model Validation (server-side)', () => {

    // -----------------------------------------------------------------------
    suite('Map elements', () => {

        test('valid map with topicrefs produces no content model errors', () => {
            const xml =
                '<?xml version="1.0"?>\n' +
                '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n' +
                '<map><title>Test</title><topicref href="a.dita"/></map>';
            const diags = validateContentModel(xml);
            const cmDiags = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmDiags.length, 0, 'no content model errors');
        });

        test('map with <p> child reports error', () => {
            const xml = '<map><p>Not allowed</p></map>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <p> inside <map>');
            assert.ok(cmErrors[0].message.includes('<p>'));
            assert.ok(cmErrors[0].message.includes('<map>'));
        });

        test('map with <body> child reports error', () => {
            const xml = '<map><body><p>Not allowed</p></body></map>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <body> inside <map>');
        });

        test('bookmap with <chapter> is valid', () => {
            const xml = '<bookmap><booktitle><mainbooktitle>T</mainbooktitle></booktitle><chapter href="c.dita"/></bookmap>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0);
        });

        test('bookmap with <section> reports error', () => {
            const xml = '<bookmap><section><title>Bad</title></section></bookmap>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <section> inside <bookmap>');
        });
    });

    // -----------------------------------------------------------------------
    suite('Topic elements', () => {

        test('valid topic structure produces no errors', () => {
            const xml =
                '<topic id="t1"><title>Hello</title><body><p>World</p></body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0);
        });

        test('topic with <topicref> child reports error', () => {
            const xml = '<topic id="t1"><title>T</title><topicref href="a.dita"/></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <topicref> inside <topic>');
        });

        test('concept with <taskbody> reports error', () => {
            const xml = '<concept id="c1"><title>C</title><taskbody><context><p>Wrong</p></context></taskbody></concept>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <taskbody> inside <concept>');
        });

        test('task with <conbody> reports error', () => {
            const xml = '<task id="t1"><title>T</title><conbody><p>Wrong</p></conbody></task>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <conbody> inside <task>');
        });

        test('reference with <body> reports error', () => {
            const xml = '<reference id="r1"><title>R</title><body><p>Wrong</p></body></reference>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <body> inside <reference>');
        });
    });

    // -----------------------------------------------------------------------
    suite('Body elements', () => {

        test('body with block content is valid', () => {
            const xml =
                '<topic id="t1"><title>T</title><body>' +
                '<p>Text</p><ul><li>Item</li></ul><table><tgroup cols="1"><tbody><row><entry>C</entry></row></tbody></tgroup></table>' +
                '</body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0);
        });

        test('body with <topicref> reports error', () => {
            const xml = '<topic id="t1"><title>T</title><body><topicref href="a.dita"/></body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <topicref> inside <body>');
        });

        test('taskbody with <p> reports error (taskbody uses task-specific elements)', () => {
            const xml = '<task id="t1"><title>T</title><taskbody><p>Wrong</p></taskbody></task>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <p> inside <taskbody>');
        });

        test('refbody with <steps> reports error', () => {
            const xml = '<reference id="r1"><title>R</title><refbody><steps><step><cmd>Do</cmd></step></steps></refbody></reference>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <steps> inside <refbody>');
        });
    });

    // -----------------------------------------------------------------------
    suite('Section nesting', () => {

        test('section with nested section reports error', () => {
            const xml =
                '<topic id="t1"><title>T</title><body>' +
                '<section><title>S1</title><section><title>S2</title></section></section>' +
                '</body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag nested <section>');
        });

        test('section with block content is valid', () => {
            const xml =
                '<topic id="t1"><title>T</title><body>' +
                '<section><title>S</title><p>Text</p><ul><li>Item</li></ul></section>' +
                '</body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0);
        });
    });

    // -----------------------------------------------------------------------
    suite('Metadata elements', () => {

        test('topicmeta with <p> reports error', () => {
            const xml = '<map><topicref href="a.dita"><topicmeta><p>Bad</p></topicmeta></topicref></map>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <p> inside <topicmeta>');
        });

        test('prolog with metadata elements is valid', () => {
            const xml =
                '<topic id="t1"><title>T</title><prolog>' +
                '<author>Jane</author><metadata><keywords><keyword>test</keyword></keywords></metadata>' +
                '</prolog><body><p>Text</p></body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0);
        });

        test('prolog with <body> reports error', () => {
            const xml = '<topic id="t1"><title>T</title><prolog><body><p>Bad</p></body></prolog></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <body> inside <prolog>');
        });
    });

    // -----------------------------------------------------------------------
    suite('Unknown/warning elements', () => {

        test('unknown element in body gets warning (DITA-CM-003)', () => {
            const xml = '<topic id="t1"><title>T</title><body><custom-element>X</custom-element></body></topic>';
            const diags = validateContentModel(xml);
            const cmWarnings = diags.filter(d => d.code === 'DITA-CM-003');
            assert.ok(cmWarnings.length > 0, 'should warn about unknown element');
            assert.strictEqual(cmWarnings[0].severity, DiagnosticSeverity.Warning);
        });
    });

    // -----------------------------------------------------------------------
    suite('Comments and CDATA handling', () => {

        test('elements inside comments are not validated', () => {
            const xml = '<topic id="t1"><title>T</title><body><!-- <topicref href="a.dita"/> --><p>OK</p></body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0, 'commented-out elements should be ignored');
        });

        test('elements inside CDATA are not validated', () => {
            const xml = '<topic id="t1"><title>T</title><body><codeblock><![CDATA[<topicref href="bad"/>]]></codeblock></body></topic>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.strictEqual(cmErrors.length, 0, 'CDATA elements should be ignored');
        });
    });

    // -----------------------------------------------------------------------
    suite('Glossentry', () => {

        test('glossentry with <body> reports error', () => {
            const xml = '<glossentry id="g1"><glossterm>Term</glossterm><body><p>Bad</p></body></glossentry>';
            const diags = validateContentModel(xml);
            const cmErrors = diags.filter(d => d.code === 'DITA-CM-001');
            assert.ok(cmErrors.length > 0, 'should flag <body> inside <glossentry>');
        });
    });
});
