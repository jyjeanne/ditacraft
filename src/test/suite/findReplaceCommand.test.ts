/**
 * Find & Replace Command Test Suite
 * Tests the pure option-parsing/label-building/edit-conversion helpers
 * directly, plus command registration. Full orchestration (sendRequest to
 * a real LSP server, VS Code's own refactor-preview UI) isn't exercised
 * here — see server/test/findReplace.test.ts for the request handler's
 * own coverage, which is where the actual matching/replacement logic lives.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    parseFindOptions,
    validateRegexQuery,
    describeSearchLabel,
    buildWorkspaceEdit,
    confirmWorkspaceEdit,
    describeFileChanges,
} from '../../commands/findReplaceCommand';
import * as sinon from 'sinon';

suite('Find & Replace Command Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    suite('Command Registration', () => {
        test('Should have findReplaceInFiles command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.findReplaceInFiles'),
                'ditacraft.findReplaceInFiles command should be registered'
            );
        });
    });

    suite('parseFindOptions', () => {
        test('Should default every flag to false when nothing is selected', () => {
            assert.deepStrictEqual(parseFindOptions([]), {
                caseSensitive: false,
                useRegex: false,
                wholeWord: false,
                includeAttributeValues: false
            });
        });

        test('Should set only the flags that were selected', () => {
            assert.deepStrictEqual(
                parseFindOptions([{ value: 'useRegex' }, { value: 'wholeWord' }]),
                { caseSensitive: false, useRegex: true, wholeWord: true, includeAttributeValues: false }
            );
        });

        test('Should set every flag when all are selected', () => {
            assert.deepStrictEqual(
                parseFindOptions([{ value: 'caseSensitive' }, { value: 'useRegex' }, { value: 'wholeWord' }, { value: 'includeAttributeValues' }]),
                { caseSensitive: true, useRegex: true, wholeWord: true, includeAttributeValues: true }
            );
        });
    });

    suite('validateRegexQuery', () => {
        test('Should return undefined for a valid regex', () => {
            assert.strictEqual(validateRegexQuery('(foo|bar)+'), undefined);
        });

        test('Should return an error message for an invalid regex', () => {
            const result = validateRegexQuery('(unclosed');
            assert.ok(result, 'should return an error message');
            assert.ok(result!.includes('Invalid regular expression'));
        });
    });

    suite('describeSearchLabel', () => {
        test('Should pluralize "match"/"file" correctly', () => {
            assert.strictEqual(
                describeSearchLabel('foo', 'bar', 1, 1),
                'Find & Replace: "foo" → "bar" (1 match in 1 file)'
            );
            assert.strictEqual(
                describeSearchLabel('foo', 'bar', 5, 3),
                'Find & Replace: "foo" → "bar" (5 matches in 3 files)'
            );
        });

        test('Should include an empty replacement literally (deletion case)', () => {
            assert.ok(describeSearchLabel('foo', '', 2, 1).includes('"foo" → ""'));
        });
    });

    suite('buildWorkspaceEdit', () => {
        test('Should convert LSP-shaped changes into a vscode.WorkspaceEdit', () => {
            const uri = 'file:///workspace/topic.dita';
            const lspEdit = {
                changes: {
                    [uri]: [
                        {
                            range: { start: { line: 0, character: 5 }, end: { line: 0, character: 8 } },
                            newText: 'new'
                        }
                    ]
                }
            };

            const edit = buildWorkspaceEdit(lspEdit, 'Test label', true);
            const entries = edit.get(vscode.Uri.parse(uri));

            assert.strictEqual(entries.length, 1);
            assert.strictEqual(entries[0].newText, 'new');
            assert.strictEqual(entries[0].range.start.line, 0);
            assert.strictEqual(entries[0].range.start.character, 5);
            assert.strictEqual(entries[0].range.end.character, 8);
        });

        test('Should handle multiple files and multiple edits per file', () => {
            const uriA = 'file:///workspace/a.dita';
            const uriB = 'file:///workspace/b.dita';
            const lspEdit = {
                changes: {
                    [uriA]: [
                        { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }, newText: 'x' },
                        { range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } }, newText: 'y' }
                    ],
                    [uriB]: [
                        { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }, newText: 'z' }
                    ]
                }
            };

            const edit = buildWorkspaceEdit(lspEdit, 'Test label', true);
            assert.strictEqual(edit.get(vscode.Uri.parse(uriA)).length, 2);
            assert.strictEqual(edit.get(vscode.Uri.parse(uriB)).length, 1);
        });

        test('Should return an empty WorkspaceEdit when there are no changes', () => {
            const edit = buildWorkspaceEdit({}, 'Test label', false);
            assert.strictEqual(edit.size, 0);
        });
    });

    suite('confirmWorkspaceEdit (regression: the Refactor Preview opened with every change unticked, so Apply did nothing)', () => {
        let sandbox: sinon.SinonSandbox;
        setup(() => { sandbox = sinon.createSandbox(); });
        teardown(() => sandbox.restore());

        test('Should ask in a modal dialog, listing the files, and map the buttons to apply / review / cancel', async () => {
            const stub = sandbox.stub(vscode.window, 'showInformationMessage');
            stub.resolves('Replace' as unknown as vscode.MessageItem);
            assert.strictEqual(await confirmWorkspaceEdit('Replace 3 matches?', 'a.dita (3 matches)', 'Replace'), 'apply');
            const [message, options, ...buttons] = stub.firstCall.args as unknown as [string, vscode.MessageOptions, ...string[]];
            assert.strictEqual(message, 'Replace 3 matches?');
            assert.strictEqual(options.modal, true);
            assert.ok(options.detail?.startsWith('a.dita (3 matches)'), options.detail ?? '');
            assert.ok(/tick the ones to make/.test(options.detail ?? ''), 'the dialog says the preview starts unticked');
            assert.deepStrictEqual(buttons, ['Replace', 'Review Changes…']);

            stub.resolves('Review Changes…' as unknown as vscode.MessageItem);
            assert.strictEqual(await confirmWorkspaceEdit('?', '', 'Replace'), 'review');
            stub.resolves(undefined);
            assert.strictEqual(await confirmWorkspaceEdit('?', '', 'Replace'), undefined);
        });
    });

    suite('describeFileChanges', () => {
        test('Should list each file with its change count, sorted, and cut the list after max files', () => {
            const change = { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }, newText: 'x' };
            const lspEdit = { changes: {
                'file:///w/b.dita': [change],
                'file:///w/a.dita': [change, change],
                'file:///w/c.dita': [change],
            } };
            const lines = describeFileChanges(lspEdit, 'match', 'matches').split('\n');
            assert.strictEqual(lines.length, 3);
            assert.ok(lines[0].endsWith('a.dita (2 matches)'), lines[0]);
            assert.ok(lines[1].endsWith('b.dita (1 match)'), lines[1]);
            assert.deepStrictEqual(describeFileChanges(lspEdit, 'match', 'matches', 2).split('\n').slice(2), ['…and 1 more file']);
        });
    });
});
