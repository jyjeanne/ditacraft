import * as assert from 'assert';
import { classTokens, defaultClass, documentClassContext, elementClass, isReuseCompatible, specializes } from '../src/utils/ditaClass';

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

    suite('specializes', () => {
        test('a class is the other class or a specialization of it', () => {
            assert.ok(specializes('+ topic/ph pr-d/codeph', '- topic/ph'));
            assert.ok(specializes('- topic/li task/step', '- topic/li'));
            assert.ok(specializes('- topic/li task/step', '- topic/li task/step'));
            assert.ok(!specializes('- topic/li', '- topic/li task/step'), 'a more general element');
            assert.ok(!specializes('- topic/note', '- topic/p'), 'an unrelated element');
            assert.ok(!specializes('+ topic/ph ui-d/uicontrol', '+ topic/ph pr-d/codeph'), 'a sibling specialization');
        });

        test('an unknown class is not reported: the type cannot be known', () => {
            assert.ok(specializes('- topic/p', undefined));
            assert.ok(specializes(undefined, '- topic/p'));
            assert.ok(specializes('', ''));
        });
    });

    suite('isReuseCompatible', () => {
        const element = (name: string, cls: string, version: '1.2' | '1.3' | '2.0' = '1.3', isMap = false) =>
            ({ name, cls, context: { version, isMap } });

        test('a pull reuses the referencing element or a specialization of it; a push, the other way round', () => {
            const step = element('step', '- topic/li task/step');
            const li = element('li', '- topic/li');
            assert.ok(isReuseCompatible(element('ph', '- topic/ph'), element('codeph', '+ topic/ph pr-d/codeph')));
            assert.ok(!isReuseCompatible(step, li), 'a <step> may not pull an <li>');
            assert.ok(isReuseCompatible(step, li, true), 'a <step> may be pushed where an <li> is: it is generalized');
            assert.ok(!isReuseCompatible(li, step, true), 'an <li> may not be pushed where a <step> is');
        });

        test('the same element in two DITA versions is compatible; in one version, the class decides', () => {
            assert.ok(isReuseCompatible(element('navtitle', '+ topic/titlealt alternativeTitles-d/navtitle', '2.0', true),
                element('navtitle', '- topic/navtitle', '1.3', true)), 'its class changed in DITA 2.0');
            assert.ok(!isReuseCompatible(element('shortdesc', '- map/shortdesc', '1.3', true), element('shortdesc', '- topic/shortdesc')),
                'a map <shortdesc> may not reuse a topic one (DITA-OT 4.3.5: DOTX010E)');
        });
    });

    test('classTokens keeps the module/element tokens, most general first', () => {
        assert.deepStrictEqual(classTokens('+ topic/note hazard-d/hazardstatement '), ['topic/note', 'hazard-d/hazardstatement']);
        assert.deepStrictEqual(classTokens(undefined), []);
    });
});
