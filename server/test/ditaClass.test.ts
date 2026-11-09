import * as assert from 'assert';
import { classTokens, defaultClass, documentClassContext, elementClass, isReuseCompatible } from '../src/utils/ditaClass';

suite('ditaClass', () => {
    const topic13 = { version: '1.3', isMap: false } as const;

    suite('defaultClass', () => {
        test('the class of an OASIS element, by DITA version and document type', () => {
            assert.strictEqual(defaultClass('codeph', topic13), '+ topic/ph pr-d/codeph');
            assert.strictEqual(defaultClass('step', topic13), '- topic/li task/step');
            // shortdesc, linktext and searchtitle have another class in maps
            assert.strictEqual(defaultClass('shortdesc', topic13), '- topic/shortdesc');
            assert.strictEqual(defaultClass('shortdesc', { version: '1.3', isMap: true }), '- map/shortdesc');
            assert.strictEqual(defaultClass('topicref', topic13), '- map/topicref', 'an element of maps only');
            // reqconds: ordered in DITA 1.2, unordered in 1.3; 1.0 and 1.1 read the 1.2 classes
            assert.strictEqual(defaultClass('reqconds', { version: '1.2', isMap: false }), '+ topic/ol task/ol taskreq-d/reqconds');
            assert.strictEqual(defaultClass('reqconds', { version: '1.1', isMap: false }), '+ topic/ol task/ol taskreq-d/reqconds');
            assert.strictEqual(defaultClass('reqconds', topic13), '+ topic/ul task/ul taskreq-d/reqconds');
            assert.strictEqual(defaultClass('reqconds', { version: 'unknown', isMap: false }), '+ topic/ul task/ul taskreq-d/reqconds');
            // DITA 2.0 changed some classes
            assert.strictEqual(defaultClass('imagemap', { version: '2.0', isMap: false }), '+ topic/div ut-d/imagemap');
            assert.strictEqual(defaultClass('imagemap', topic13), '+ topic/fig ut-d/imagemap');
        });

        test('an unknown element has no class, nor has a property name of Object', () => {
            assert.strictEqual(defaultClass('mything', topic13), undefined);
            for (const context of [topic13, { version: '1.2', isMap: true }, { version: '2.0', isMap: false }] as const) {
                assert.strictEqual(defaultClass('constructor', context), undefined, `DITA ${context.version}`);
                assert.strictEqual(defaultClass('toString', context), undefined, `DITA ${context.version}`);
            }
        });
    });

    test('elementClass: the class written on the element wins over the default', () => {
        assert.strictEqual(elementClass('myph', ' + topic/ph my-d/myph ', topic13), '+ topic/ph my-d/myph');
        assert.strictEqual(elementClass('ph', undefined, topic13), '- topic/ph');
        assert.strictEqual(elementClass('ph', '  ', topic13), '- topic/ph', 'an empty @class is no class');
        assert.strictEqual(elementClass('mything', undefined, topic13), undefined);
    });

    suite('documentClassContext', () => {
        test('the DITA version, and whether the root element is a map', () => {
            assert.deepStrictEqual(documentClassContext('<map><topicref href="a.dita"/></map>'), { version: '1.3', isMap: true });
            assert.deepStrictEqual(documentClassContext('<topic id="t"><title>T</title></topic>'), { version: '1.3', isMap: false });
            assert.deepStrictEqual(documentClassContext(
                '<?xml version="1.0"?>\n<!-- <map> in a comment -->\n<!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA 1.2 BookMap//EN" "bookmap.dtd" [\n<!ENTITY e "<map>">\n]>\n<bookmap id="b"/>'),
            { version: '1.2', isMap: true }, 'a map specialization, after a prolog with an internal subset');
            assert.deepStrictEqual(documentClassContext('﻿<mymap class="- map/map my-d/mymap " ditaarch:DITAArchVersion="2.0"/>'),
                { version: '2.0', isMap: true }, "a project's map, by its own @class");
            assert.deepStrictEqual(documentClassContext('no markup'), { version: '1.3', isMap: false });
        });
    });

    suite('isReuseCompatible', () => {
        test('the referenced element is the referencing element or a specialization of it', () => {
            assert.ok(isReuseCompatible('- topic/ph', '+ topic/ph pr-d/codeph'));
            assert.ok(isReuseCompatible('- topic/li', '- topic/li task/step'));
            assert.ok(isReuseCompatible('- topic/li task/step', '- topic/li task/step'));
            assert.ok(!isReuseCompatible('- topic/li task/step', '- topic/li'), 'a more general element');
            assert.ok(!isReuseCompatible('- topic/p', '- topic/note'), 'an unrelated element');
            assert.ok(!isReuseCompatible('+ topic/ph pr-d/codeph', '+ topic/ph ui-d/uicontrol'), 'a sibling specialization');
        });

        test('an unknown class is not reported: the type cannot be known', () => {
            assert.ok(isReuseCompatible(undefined, '- topic/p'));
            assert.ok(isReuseCompatible('- topic/p', undefined));
            assert.ok(isReuseCompatible('', ''));
        });
    });

    test('classTokens keeps the module/element tokens, most general first', () => {
        assert.deepStrictEqual(classTokens('+ topic/note hazard-d/hazardstatement '), ['topic/note', 'hazard-d/hazardstatement']);
        assert.deepStrictEqual(classTokens(undefined), []);
    });
});
