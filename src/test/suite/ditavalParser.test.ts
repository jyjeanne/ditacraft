/**
 * DITAVAL Rule Parsing Test Suite (§4.5 Piece 2)
 * Pure-function tests for parseDitavalRules/isExcludedByRules — no VS Code
 * API surface involved, so these don't need the extension host at all.
 */

import * as assert from 'assert';
import { parseDitavalRules, isExcludedByRules, buildDitavalDocument, governingRule, conditionGroups, PROFILING_ATTRIBUTES } from '../../utils/ditavalParser';

suite('DITAVAL Rule Parsing Test Suite', () => {
    suite('parseDitavalRules', () => {
        test('Should parse a single exclude rule', () => {
            const rules = parseDitavalRules(
                '<val><prop action="exclude" att="audience" val="internal"/></val>'
            );
            assert.deepStrictEqual(rules, [{ action: 'exclude', att: 'audience', val: 'internal' }]);
        });

        test('Should parse multiple rules of different actions', () => {
            const rules = parseDitavalRules(
                '<val>' +
                '<prop action="exclude" att="audience" val="internal"/>' +
                '<prop action="include" att="platform" val="windows"/>' +
                '<prop action="flag" att="rev" val="2.0"/>' +
                '</val>'
            );
            assert.strictEqual(rules.length, 3);
            assert.strictEqual(rules[0].action, 'exclude');
            assert.strictEqual(rules[1].action, 'include');
            assert.strictEqual(rules[2].action, 'flag');
        });

        test('Should lowercase action and att, but preserve val case', () => {
            const rules = parseDitavalRules(
                '<prop ACTION="EXCLUDE" ATT="Audience" val="Internal"/>'
            );
            assert.deepStrictEqual(rules, [{ action: 'exclude', att: 'audience', val: 'Internal' }]);
        });

        test('Should skip a <prop> with no action attribute', () => {
            const rules = parseDitavalRules('<prop att="audience" val="internal"/>');
            assert.deepStrictEqual(rules, []);
        });

        test('Should handle a rule with no val (applies to any value of the attribute)', () => {
            const rules = parseDitavalRules('<prop action="exclude" att="platform"/>');
            assert.deepStrictEqual(rules, [{ action: 'exclude', att: 'platform', val: undefined }]);
        });

        test('Should return an empty array for content with no <prop> rules', () => {
            assert.deepStrictEqual(parseDitavalRules('<val></val>'), []);
        });

        test('Should support single-quoted attribute values', () => {
            const rules = parseDitavalRules(`<prop action='exclude' att='audience' val='internal'/>`);
            assert.deepStrictEqual(rules, [{ action: 'exclude', att: 'audience', val: 'internal' }]);
        });
    });

    suite('isExcludedByRules', () => {
        test('Should exclude when an attribute value matches an exclude rule exactly', () => {
            const rules = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            assert.strictEqual(isExcludedByRules({ audience: 'internal' }, rules), true);
        });

        test('Should not exclude when the attribute value does not match', () => {
            const rules = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            assert.strictEqual(isExcludedByRules({ audience: 'external' }, rules), false);
        });

        test('Should not exclude when the element lacks the targeted attribute', () => {
            const rules = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            assert.strictEqual(isExcludedByRules({ platform: 'windows' }, rules), false);
        });

        test('Should keep an element when one of its values is still included (DITA filtering logic)', () => {
            // audience="external internal" with only "internal" excluded: the
            // element is published for the external audience.
            const rules = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            assert.strictEqual(isExcludedByRules({ audience: 'external internal' }, rules), false);
        });

        test('Should exclude when every value of the attribute is excluded', () => {
            const rules = [
                { action: 'exclude', att: 'audience', val: 'internal' },
                { action: 'exclude', att: 'audience', val: 'expert' }
            ];
            assert.strictEqual(isExcludedByRules({ audience: 'internal  expert' }, rules), true);
        });

        test('Should exclude when any one attribute excludes, even if another keeps the element', () => {
            const rules = [
                { action: 'exclude', att: 'audience', val: 'internal' },
                { action: 'include', att: 'platform', val: 'windows' }
            ];
            assert.strictEqual(isExcludedByRules({ audience: 'internal', platform: 'windows' }, rules), true);
        });

        test('Should combine specific rules and the attribute default value by value', () => {
            const rules = [
                { action: 'exclude', att: 'platform', val: undefined },
                { action: 'include', att: 'platform', val: 'windows' }
            ];
            // "windows" is included by its own rule: the element stays.
            assert.strictEqual(isExcludedByRules({ platform: 'linux windows' }, rules), false);
            // Both values fall back to the exclude default.
            assert.strictEqual(isExcludedByRules({ platform: 'linux mac' }, rules), true);
        });

        test('Should not exclude an attribute without values', () => {
            const rules = [{ action: 'exclude', att: 'audience', val: undefined }];
            assert.strictEqual(isExcludedByRules({ audience: '  ' }, rules), false);
        });

        test('Should match attribute names case-insensitively (deliveryTarget)', () => {
            // parseDitavalRules lower-cases a rule's att; elements carry the camel-case name.
            const rules = parseDitavalRules('<prop action="exclude" att="deliveryTarget" val="pdf"/>');
            assert.strictEqual(isExcludedByRules({ deliveryTarget: 'pdf' }, rules), true);
        });

        test('Should exclude regardless of value when the rule has att but no val', () => {
            const rules = [{ action: 'exclude', att: 'platform', val: undefined }];
            assert.strictEqual(isExcludedByRules({ platform: 'anything' }, rules), true);
        });

        test('Should ignore non-exclude actions (include/flag) — not decoration-worthy', () => {
            const rules = [
                { action: 'include', att: 'audience', val: 'internal' },
                { action: 'flag', att: 'audience', val: 'internal' }
            ];
            assert.strictEqual(isExcludedByRules({ audience: 'internal' }, rules), false);
        });

        test('Should apply a filter-wide default rule (no att) to values with no rule of their own', () => {
            // <prop action="exclude"/>: every filtering value not otherwise set is excluded.
            const rules = parseDitavalRules('<val><prop action="exclude"/><prop action="include" att="audience" val="user"/></val>');
            assert.strictEqual(isExcludedByRules({ audience: 'admin' }, rules), true);
            assert.strictEqual(isExcludedByRules({ audience: 'user' }, rules), false, 'its own rule wins');
            assert.strictEqual(isExcludedByRules({ audience: 'admin user' }, rules), false, 'one value included');
            assert.strictEqual(isExcludedByRules({ platform: 'linux', deliveryTarget: 'pdf' }, rules), true);
        });

        test('Should let an attribute default rule win over the filter-wide default', () => {
            const rules = parseDitavalRules('<val><prop action="exclude"/><prop action="include" att="platform"/></val>');
            assert.strictEqual(isExcludedByRules({ platform: 'linux' }, rules), false);
            assert.strictEqual(isExcludedByRules({ platform: 'linux', product: 'kit' }, rules), true, 'another attribute still excludes');
        });

        test('Should not apply the filter-wide default to non-filtering attributes (rev, id, outputclass…)', () => {
            const rules = [{ action: 'exclude', att: undefined, val: undefined }];
            assert.strictEqual(isExcludedByRules({ rev: '2.0', id: 'p1', outputclass: 'wide' }, rules), false);
            // …unless the caller says the attribute filters (a @props specialization the document declares).
            assert.strictEqual(isExcludedByRules({ jobrole: 'manager' }, rules, (n) => n === 'jobrole'), true);
            // A rule naming an attribute still applies to it.
            assert.strictEqual(isExcludedByRules({ outputclass: 'wide' }, [{ action: 'exclude', att: 'outputclass', val: 'wide' }]), true);
        });

        test('Should keep content under a filter-wide include or flag default', () => {
            assert.strictEqual(isExcludedByRules({ audience: 'admin' }, [{ action: 'include', att: undefined, val: undefined }]), false);
            assert.strictEqual(isExcludedByRules({ audience: 'admin' }, [{ action: 'flag', att: undefined, val: undefined }]), false);
            // A value without an attribute is not a rule DITA defines: ignored.
            assert.strictEqual(isExcludedByRules({ audience: 'admin' }, [{ action: 'exclude', att: undefined, val: 'admin' }]), false);
        });

        test('Should return false for an empty rule set', () => {
            assert.strictEqual(isExcludedByRules({ audience: 'internal' }, []), false);
        });

        test('Should match against any of multiple exclude rules', () => {
            const rules = [
                { action: 'exclude', att: 'audience', val: 'internal' },
                { action: 'exclude', att: 'platform', val: 'windows' }
            ];
            assert.strictEqual(isExcludedByRules({ platform: 'windows' }, rules), true);
        });

        test('Should let a specific include rule override a val-less exclude default for the same attribute (regression)', () => {
            // Standard DITAVAL "exclude by default, selectively include" pattern:
            // <prop action="exclude" att="platform"/>
            // <prop action="include" att="platform" val="windows"/>
            // An element tagged platform="windows" must NOT be treated as
            // excluded, even though the val-less default rule for the same
            // attribute is an exclude — the more specific rule wins,
            // regardless of declaration order.
            const rules = [
                { action: 'exclude', att: 'platform', val: undefined },
                { action: 'include', att: 'platform', val: 'windows' }
            ];
            assert.strictEqual(isExcludedByRules({ platform: 'windows' }, rules), false);
        });

        test('Should still apply the val-less exclude default when no specific rule matches the value (regression)', () => {
            const rules = [
                { action: 'exclude', att: 'platform', val: undefined },
                { action: 'include', att: 'platform', val: 'windows' }
            ];
            // "linux" has no specific rule of its own, so the default applies.
            assert.strictEqual(isExcludedByRules({ platform: 'linux' }, rules), true);
        });

        test('Should apply the specific rule\'s precedence even when it appears before the default in the file', () => {
            const rules = [
                { action: 'include', att: 'platform', val: 'windows' },
                { action: 'exclude', att: 'platform', val: undefined }
            ];
            assert.strictEqual(isExcludedByRules({ platform: 'windows' }, rules), false);
        });
    });

    suite('governingRule', () => {
        test('Should pick the value\'s rule, then the attribute default, then the filter-wide default (filtering attributes only)', () => {
            const rules = parseDitavalRules('<val><prop action="flag" color="red"/><prop action="exclude" att="platform"/>'
                + '<prop action="include" att="platform" val="windows"/></val>');
            assert.deepStrictEqual(governingRule('platform', 'windows', rules), { action: 'include', att: 'platform', val: 'windows' });
            assert.strictEqual(governingRule('platform', 'linux', rules)?.action, 'exclude');
            assert.strictEqual(governingRule('audience', 'admin', rules)?.action, 'flag');
            assert.strictEqual(governingRule('rev', '2', rules), undefined);
            assert.strictEqual(governingRule('outputclass', 'x', rules), undefined);
        });
    });

    suite('grouped values (DITA 1.3 §2.4.3.1, §2.4.3.2)', () => {
        const groups = (name: string, value: string): string[] =>
            conditionGroups(name, value).map(g => `${g.name ?? ''}(${g.tokens.join(' ')})`);
        const excluded = (attrs: Record<string, string>, ditaval: string): boolean =>
            isExcludedByRules(attrs, parseDitavalRules(`<val>${ditaval}</val>`));

        test('Should read groups as DITA 1.3 §2.4.3.1 defines them', () => {
            // "The following values for the @otherprops attribute are equivalent"
            assert.deepStrictEqual(groups('otherprops', 'groupA(a b) groupA(c) groupZ(APPNAME)'), ['groupA(a b c)', 'groupZ(APPNAME)']);
            assert.deepStrictEqual(groups('otherprops', 'groupA(a b c) groupZ(APPNAME)'), ['groupA(a b c)', 'groupZ(APPNAME)']);
            // "the ungrouped values belong to an implicit group; the name of that group matches the name of the attribute"
            assert.deepStrictEqual(groups('product', 'a database(dbA dbB) b appserver(mySERVER) c'), ['(a b c)', 'database(dbA dbB)', 'appserver(mySERVER)']);
            assert.deepStrictEqual(groups('product', 'product(a b c) database(dbA dbB) appserver(mySERVER)'), ['(a b c)', 'database(dbA dbB)', 'appserver(mySERVER)']);
            // "<ph product="database() A"> is equivalent to <ph product="A">"; "<ph product="operatingSystem()"> is equivalent to <ph>"
            assert.deepStrictEqual(groups('product', 'database() A'), ['(A)']);
            assert.deepStrictEqual(groups('product', 'operatingSystem()'), []);
            assert.deepStrictEqual(groups('rev', 'a(b) c'), ['(a(b) c)'], 'an attribute without groups');
        });

        test('Should exclude the step of the standard\'s example by its appserver() or database() group', () => {
            // DITA 1.3 §2.4.3.2: a step "might apply to one application server and two database applications"
            const step = { product: 'appserver(mySERVER) database(ABC dbOtherName)' };
            assert.strictEqual(excluded(step, '<prop att="product" val="mySERVER" action="exclude"/>'), true,
                '"This can be done by setting product="mySERVER" to exclude"');
            assert.strictEqual(excluded(step, '<prop att="appserver" val="mySERVER" action="exclude"/>'), true,
                '"or by setting appserver="mySERVER" to exclude"');
            assert.strictEqual(excluded(step, '<prop att="appserver" val="mySERVER" action="include"/><prop att="product" val="mySERVER" action="exclude"/>'), false,
                '"the rule for the more specific group name "appserver" takes precedence"');
            assert.strictEqual(excluded(step, '<prop att="product" val="mySERVER" action="include"/><prop att="appserver" val="mySERVER" action="exclude"/>'), true);
            assert.strictEqual(excluded(step, '<prop att="product" val="ABC" action="exclude"/><prop att="product" val="dbOtherName" action="exclude"/>'), true,
                '"if both "ABC" and "dbOtherName" evaluate to exclude, then the database() group evaluates to exclude"');
            assert.strictEqual(excluded(step, '<prop att="product" val="ABC" action="exclude"/>'), false, 'dbOtherName is still included');
        });

        test('Should decide a value of a group in the order of DITA 1.3 §2.4.3.2, whatever the order of the rules', () => {
            // "the full precedence for determining whether to include or exclude the value", for "myDB"
            // in a database() group within @product
            const steps = [
                '<prop att="database" val="myDB" action="include"/>',
                '<prop att="product" val="myDB" action="exclude"/>',
                '<prop att="product" val="database" action="include"/>',
                '<prop att="product" action="exclude"/>',
                '<prop action="include"/>',
            ];
            for (let step = 0; step < steps.length; step++) {
                const rules = parseDitavalRules(`<val>${steps.slice(step).reverse().join('')}</val>`);
                assert.deepStrictEqual(governingRule('product', 'myDB', rules, undefined, 'database'),
                    parseDitavalRules(`<val>${steps[step]}</val>`)[0], `step ${step + 1}`);
            }
            assert.strictEqual(governingRule('product', 'myDB', [], undefined, 'database'), undefined, '"Otherwise, evaluate to "include""');
            // product="database" "also excludes the more common usage of "database" as a single value"
            assert.strictEqual(excluded({ product: 'database' }, '<prop att="product" val="database" action="exclude"/>'), true);
            assert.strictEqual(excluded({ product: 'database(myDB)' }, '<prop att="product" val="database" action="exclude"/>'), true);
        });

        test('Should take the values outside any group as a group of their own, and merge groups of the same name', () => {
            const rule = '<prop att="product" val="dbA" action="exclude"/>';
            assert.strictEqual(excluded({ product: 'dbA dbB' }, rule), false, 'no group: dbB is still included');
            assert.strictEqual(excluded({ product: 'dbA database(dbB)' }, rule), true, 'the group of the ungrouped values excludes');
            assert.strictEqual(excluded({ product: 'database(dbA) database(dbB)' }, rule), false, 'one database() group');
        });

        test('Should take an empty group as no value', () => {
            const rule = '<prop att="audience" action="exclude"/>';
            assert.strictEqual(excluded({ audience: 'novice()' }, rule), false, '"the attribute is treated as "include""');
            assert.strictEqual(excluded({ audience: 'novice() expert' }, rule), true);
        });

        test('Should apply a rule on a group name in every attribute with that group', () => {
            // "a DITAVAL rule for sampleGroup="value" will evaluate the same in each attribute"
            const rule = '<prop att="sampleGroup" val="value" action="exclude"/>';
            assert.strictEqual(excluded({ platform: 'sampleGroup(value)' }, rule), true);
            assert.strictEqual(excluded({ otherprops: 'sampleGroup(value)' }, rule), true);
            assert.strictEqual(excluded({ platform: 'value' }, rule), false, 'not in the group');
        });

        test('Should read a rule on a group name without a value as the group\'s default, as DITA-OT does', () => {
            // Not in the standard; DITA-OT 4.3.5 applies it right after the rule on the group's value.
            const rules = '<prop att="vendor" action="exclude"/><prop att="product" val="v2" action="include"/><prop att="vendor" val="v3" action="include"/>';
            assert.strictEqual(excluded({ product: 'vendor(v1)' }, rules), true);
            assert.strictEqual(excluded({ product: 'vendor(v2)' }, rules), true, 'before the rule on the attribute\'s value');
            assert.strictEqual(excluded({ product: 'vendor(v3)' }, rules), false, 'after the rule on the group\'s value');
            assert.strictEqual(excluded({ product: 'v1' }, rules), false, 'not in the group');
        });
    });

    suite('PROFILING_ATTRIBUTES', () => {
        test('Should include the standard DITA profiling attributes', () => {
            for (const attr of ['audience', 'platform', 'product', 'otherprops', 'props', 'rev']) {
                assert.ok(PROFILING_ATTRIBUTES.includes(attr as (typeof PROFILING_ATTRIBUTES)[number]));
            }
        });

        test('Should include deliveryTarget (regression: must not drift from the scheme-validated attribute set)', () => {
            // batchMetadataCommand.ts's KNOWN_PROFILING_ATTRIBUTES and the
            // server's profilingValidation.ts PROFILING_ATTRIBUTES both
            // include deliveryTarget -- this list is a superset of those
            // (it also keeps `rev`, which those two correctly omit), so it
            // must never drop an attribute they both already validate.
            assert.ok(PROFILING_ATTRIBUTES.includes('deliveryTarget'));
        });
    });

    suite('buildDitavalDocument', () => {
        test('Should produce an empty <val/> for no rules', () => {
            const doc = buildDitavalDocument([]);
            assert.strictEqual(doc, '<?xml version="1.0" encoding="UTF-8"?>\n<val>\n</val>\n');
        });

        test('Should serialize a single rule with action/att/val', () => {
            const doc = buildDitavalDocument([{ action: 'exclude', att: 'audience', val: 'internal' }]);
            assert.ok(doc.includes('<prop action="exclude" att="audience" val="internal"/>'));
        });

        test('Should serialize a value-less rule without a val attribute', () => {
            const doc = buildDitavalDocument([{ action: 'exclude', att: 'platform' }]);
            assert.ok(doc.includes('<prop action="exclude" att="platform"/>'));
            assert.ok(!doc.includes('val='));
        });

        test('Should round-trip through parseDitavalRules', () => {
            const rules = [
                { action: 'exclude', att: 'audience', val: 'internal' },
                { action: 'include', att: 'platform', val: 'windows' },
                { action: 'flag', att: 'rev', val: '2.0' }
            ];
            const doc = buildDitavalDocument(rules);
            assert.deepStrictEqual(parseDitavalRules(doc), rules);
        });

        test('Should escape special characters in attribute values', () => {
            const doc = buildDitavalDocument([{ action: 'exclude', att: 'otherprops', val: 'a&b<c"d' }]);
            assert.ok(doc.includes('val="a&amp;b&lt;c&quot;d"'));
        });

        test('Should preserve rule order', () => {
            const rules = [
                { action: 'exclude', att: 'audience', val: 'b' },
                { action: 'exclude', att: 'audience', val: 'a' }
            ];
            const doc = buildDitavalDocument(rules);
            assert.ok(doc.indexOf('val="b"') < doc.indexOf('val="a"'));
        });
    });
});
