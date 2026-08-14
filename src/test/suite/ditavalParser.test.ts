/**
 * DITAVAL Rule Parsing Test Suite (§4.5 Piece 2)
 * Pure-function tests for parseDitavalRules/isExcludedByRules — no VS Code
 * API surface involved, so these don't need the extension host at all.
 */

import * as assert from 'assert';
import { parseDitavalRules, isExcludedByRules, PROFILING_ATTRIBUTES } from '../../utils/ditavalParser';

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

        test('Should exclude on a space-separated value list containing the excluded token', () => {
            const rules = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            assert.strictEqual(isExcludedByRules({ audience: 'external internal' }, rules), true);
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

        test('Should ignore a rule with no att (scheme-wide default, not attribute-specific)', () => {
            const rules = [{ action: 'exclude', att: undefined, val: undefined }];
            assert.strictEqual(isExcludedByRules({ audience: 'internal' }, rules), false);
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

    suite('PROFILING_ATTRIBUTES', () => {
        test('Should include the standard DITA profiling attributes', () => {
            for (const attr of ['audience', 'platform', 'product', 'otherprops', 'props', 'rev']) {
                assert.ok(PROFILING_ATTRIBUTES.includes(attr as (typeof PROFILING_ATTRIBUTES)[number]));
            }
        });
    });
});
