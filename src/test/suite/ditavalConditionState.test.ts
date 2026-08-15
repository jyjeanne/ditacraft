/**
 * Visual DITAVAL Condition Editor — Pure State Helper Tests (§5.3)
 * No VS Code API surface involved, so these don't need the extension
 * host at all.
 */

import * as assert from 'assert';
import {
    mergeAttributeState,
    applyConditionToggle,
    nextConditionAction,
    SchemeAttributeInfo
} from '../../utils/ditavalConditionState';
import { DitavalRule } from '../../utils/ditavalParser';

suite('DITAVAL Condition Editor State Test Suite', () => {
    suite('mergeAttributeState', () => {
        test('Should list every scheme-discovered attribute/value with a null action when the file has no rules', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'audience', values: [{ value: 'internal' }, { value: 'external' }] }
            ];
            const result = mergeAttributeState(scheme, []);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].attribute, 'audience');
            assert.deepStrictEqual(
                result[0].values.map(v => ({ value: v.value, action: v.action })),
                [{ value: 'external', action: null }, { value: 'internal', action: null }]
            );
        });

        test('Should reflect an existing value-specific rule\'s action', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'audience', values: [{ value: 'internal' }] }
            ];
            const rules: DitavalRule[] = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            const result = mergeAttributeState(scheme, rules);
            assert.strictEqual(result[0].values[0].action, 'exclude');
        });

        test('Should surface a value already in the file but not offered by the scheme, rather than dropping it', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'audience', values: [{ value: 'internal' }] }
            ];
            const rules: DitavalRule[] = [{ action: 'include', att: 'audience', val: 'legacy-value' }];
            const result = mergeAttributeState(scheme, rules);
            const values = result[0].values.map(v => v.value).sort();
            assert.deepStrictEqual(values, ['internal', 'legacy-value']);
            const legacy = result[0].values.find(v => v.value === 'legacy-value');
            assert.strictEqual(legacy!.action, 'include');
            assert.strictEqual(legacy!.hierarchyPath, undefined);
        });

        test('Should list an attribute that only exists in the file, not in the scheme at all', () => {
            const rules: DitavalRule[] = [{ action: 'flag', att: 'otherprops', val: 'beta' }];
            const result = mergeAttributeState([], rules);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].attribute, 'otherprops');
            assert.strictEqual(result[0].values[0].action, 'flag');
        });

        test('Should sort attributes and values alphabetically', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'platform', values: [{ value: 'windows' }, { value: 'linux' }] },
                { attribute: 'audience', values: [] }
            ];
            const result = mergeAttributeState(scheme, []);
            assert.deepStrictEqual(result.map(r => r.attribute), ['audience', 'platform']);
            assert.deepStrictEqual(result[1].values.map(v => v.value), ['linux', 'windows']);
        });

        test('Should preserve a scheme value\'s hierarchy path', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'platform', values: [{ value: 'ubuntu', hierarchyPath: 'Linux > Ubuntu' }] }
            ];
            const result = mergeAttributeState(scheme, []);
            assert.strictEqual(result[0].values[0].hierarchyPath, 'Linux > Ubuntu');
        });

        test('Should not confuse a value from a different attribute with the same name (key-collision regression)', () => {
            // Both "audience" and "platform" have a value called "internal" --
            // the key used to correlate rules to values must not collide.
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'audience', values: [{ value: 'internal' }] },
                { attribute: 'platform', values: [{ value: 'internal' }] }
            ];
            const rules: DitavalRule[] = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            const result = mergeAttributeState(scheme, rules);
            const audience = result.find(r => r.attribute === 'audience')!;
            const platform = result.find(r => r.attribute === 'platform')!;
            assert.strictEqual(audience.values[0].action, 'exclude');
            assert.strictEqual(platform.values[0].action, null);
        });

        test('Should default defaultAction to null when the file has no value-less rule for the attribute', () => {
            const scheme: SchemeAttributeInfo[] = [{ attribute: 'audience', values: [{ value: 'internal' }] }];
            const result = mergeAttributeState(scheme, []);
            assert.strictEqual(result[0].defaultAction, null);
        });

        test('Should surface a value-less "default for this attribute" rule as defaultAction (regression: was previously invisible)', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'platform', values: [{ value: 'linux' }, { value: 'windows' }] }
            ];
            const defaultRules: DitavalRule[] = [{ action: 'exclude', att: 'platform' }];
            const result = mergeAttributeState(scheme, [], defaultRules);
            assert.strictEqual(result[0].defaultAction, 'exclude');
            // Values with no rule of their own keep action: null -- the
            // panel is responsible for showing defaultAction as a hint
            // next to them, not for collapsing the two into one field.
            assert.deepStrictEqual(result[0].values.map(v => v.action), [null, null]);
        });

        test('Should let a value-specific rule coexist with an attribute-wide default', () => {
            const scheme: SchemeAttributeInfo[] = [
                { attribute: 'platform', values: [{ value: 'linux' }, { value: 'windows' }] }
            ];
            const valueRules: DitavalRule[] = [{ action: 'include', att: 'platform', val: 'windows' }];
            const defaultRules: DitavalRule[] = [{ action: 'exclude', att: 'platform' }];
            const result = mergeAttributeState(scheme, valueRules, defaultRules);
            assert.strictEqual(result[0].defaultAction, 'exclude');
            const windows = result[0].values.find(v => v.value === 'windows')!;
            const linux = result[0].values.find(v => v.value === 'linux')!;
            assert.strictEqual(windows.action, 'include');
            assert.strictEqual(linux.action, null);
        });

        test('Should create an attribute group for a value-less default rule even with no scheme data or value-specific rules', () => {
            const defaultRules: DitavalRule[] = [{ action: 'flag', att: 'rev' }];
            const result = mergeAttributeState([], [], defaultRules);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].attribute, 'rev');
            assert.strictEqual(result[0].defaultAction, 'flag');
            assert.deepStrictEqual(result[0].values, []);
        });

        test('Should not apply one attribute\'s default rule to a different attribute', () => {
            const defaultRules: DitavalRule[] = [{ action: 'exclude', att: 'platform' }];
            const result = mergeAttributeState(
                [{ attribute: 'audience', values: [{ value: 'internal' }] }],
                [],
                defaultRules
            );
            const audience = result.find(r => r.attribute === 'audience')!;
            assert.strictEqual(audience.defaultAction, null);
        });
    });

    suite('applyConditionToggle', () => {
        test('Should add a new rule when none exists for the attribute/value pair', () => {
            const result = applyConditionToggle([], 'audience', 'internal', 'exclude');
            assert.deepStrictEqual(result, [{ action: 'exclude', att: 'audience', val: 'internal' }]);
        });

        test('Should replace an existing rule\'s action for the same attribute/value pair', () => {
            const rules: DitavalRule[] = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            const result = applyConditionToggle(rules, 'audience', 'internal', 'flag');
            assert.deepStrictEqual(result, [{ action: 'flag', att: 'audience', val: 'internal' }]);
        });

        test('Should remove the rule entirely when action is null', () => {
            const rules: DitavalRule[] = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            const result = applyConditionToggle(rules, 'audience', 'internal', null);
            assert.deepStrictEqual(result, []);
        });

        test('Should leave other attribute/value pairs untouched', () => {
            const rules: DitavalRule[] = [
                { action: 'exclude', att: 'audience', val: 'internal' },
                { action: 'include', att: 'platform', val: 'windows' }
            ];
            const result = applyConditionToggle(rules, 'audience', 'internal', 'include');
            assert.deepStrictEqual(result, [
                { action: 'include', att: 'platform', val: 'windows' },
                { action: 'include', att: 'audience', val: 'internal' }
            ]);
        });

        test('Should not mutate the input array', () => {
            const rules: DitavalRule[] = [{ action: 'exclude', att: 'audience', val: 'internal' }];
            const copy = [...rules];
            applyConditionToggle(rules, 'audience', 'internal', 'flag');
            assert.deepStrictEqual(rules, copy);
        });
    });

    suite('nextConditionAction', () => {
        test('Should cycle null -> exclude -> include -> flag -> null', () => {
            assert.strictEqual(nextConditionAction(null), 'exclude');
            assert.strictEqual(nextConditionAction('exclude'), 'include');
            assert.strictEqual(nextConditionAction('include'), 'flag');
            assert.strictEqual(nextConditionAction('flag'), null);
        });
    });
});
