/**
 * Template Engine Test Suite
 * Tests the pure placeholder-substitution/path-resolution helpers
 * directly, plus loadTemplateRaw/renderTemplate against real temp files
 * (following the same temp-file-in-fixtures pattern already used by
 * realtimeValidation.test.ts / insertImageCommand.test.ts).
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    resolveTemplatesDir,
    substitutePlaceholders,
    loadTemplateRaw,
    renderTemplate,
} from '../../utils/templateEngine';

suite('Template Engine Test Suite', () => {

    suite('resolveTemplatesDir', () => {
        test('Should return undefined for an unset or empty path', () => {
            assert.strictEqual(resolveTemplatesDir(undefined), undefined);
            assert.strictEqual(resolveTemplatesDir(''), undefined);
            assert.strictEqual(resolveTemplatesDir('   '), undefined);
        });

        test('Should return an absolute path unchanged', () => {
            const absolute = process.platform === 'win32'
                ? 'C:\\templates'
                : '/templates';
            assert.strictEqual(resolveTemplatesDir(absolute), absolute);
        });

        test('Should resolve a relative path against the first workspace folder, or return undefined with none open', () => {
            // Adapts to whichever state this suite runs in, like the
            // equivalent resolveDitavalPath test in
            // publishProfilesCommand.test.ts.
            const resolved = resolveTemplatesDir('my-templates');
            const folder = vscode.workspace.workspaceFolders?.[0];

            if (folder) {
                assert.strictEqual(resolved, path.join(folder.uri.fsPath, 'my-templates'));
            } else {
                assert.strictEqual(resolved, undefined);
            }
        });

        test('Should substitute ${workspaceFolder} when a workspace is open, or return undefined otherwise (regression)', () => {
            // The placeholder is meaningless with no workspace open --
            // substituting it with '' would previously produce a bogus
            // "/templates" path that path.isAbsolute() (on POSIX) then
            // accepted as a real, resolved directory. Must return
            // undefined instead, matching "not configured".
            const folder = vscode.workspace.workspaceFolders?.[0];
            const resolved = resolveTemplatesDir('${workspaceFolder}/templates');

            if (folder) {
                assert.strictEqual(resolved, `${folder.uri.fsPath}/templates`);
            } else {
                assert.strictEqual(resolved, undefined);
            }
        });

        test('Should substitute every ${workspaceFolder} occurrence, not just the first (regression)', () => {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                return; // nothing to assert without a workspace folder to substitute in
            }
            const resolved = resolveTemplatesDir('${workspaceFolder}/a/${workspaceFolder}/b');
            assert.strictEqual(resolved, `${folder.uri.fsPath}/a/${folder.uri.fsPath}/b`);
        });
    });

    suite('substitutePlaceholders', () => {
        test('Should substitute all known placeholders', () => {
            const result = substitutePlaceholders(
                '<topic id="{{id}}"><title>{{title}}</title><!-- {{author}}, {{date}} --></topic>',
                { id: 'my-topic', title: 'My Topic', author: 'Jane', date: '2026-01-01' }
            );
            assert.strictEqual(
                result,
                '<topic id="my-topic"><title>My Topic</title><!-- Jane, 2026-01-01 --></topic>'
            );
        });

        test('Should tolerate whitespace inside braces', () => {
            const result = substitutePlaceholders('{{ id }} {{title}}', { id: 'x', title: 'Y' });
            assert.strictEqual(result, 'x Y');
        });

        test('Should leave a placeholder untouched when its value is undefined', () => {
            const result = substitutePlaceholders('{{id}} by {{author}}', { id: 'x' });
            assert.strictEqual(result, 'x by {{author}}');
        });

        test('Should substitute with an empty string when a value is explicitly "" (regression)', () => {
            // Distinct from "undefined" above: an explicitly empty value
            // (e.g. a user clearing a prefilled title prompt, then
            // pressing Enter rather than Escape) must actually take
            // effect, not leave a literal "{{title}}" in the output.
            const result = substitutePlaceholders('{{id}} by {{author}}', { id: 'x', author: '' });
            assert.strictEqual(result, 'x by ');
        });

        test('Should leave unknown placeholder names untouched', () => {
            const result = substitutePlaceholders('{{id}} {{unknownThing}}', { id: 'x' });
            assert.strictEqual(result, 'x {{unknownThing}}');
        });

        test('Should substitute repeated placeholders every occurrence', () => {
            const result = substitutePlaceholders('{{id}}-{{id}}', { id: 'dup' });
            assert.strictEqual(result, 'dup-dup');
        });

        test('Should XML-escape substituted values (regression)', () => {
            // A free-text title/author containing &, <, >, or " must not
            // produce non-well-formed XML when substituted into DITA
            // content.
            const result = substitutePlaceholders(
                '<title>{{title}}</title><!-- {{author}} -->',
                { id: 'x', title: 'Setup & Config <required>', author: 'O\'Brien & Co. "Team"' }
            );
            assert.strictEqual(
                result,
                '<title>Setup &amp; Config &lt;required&gt;</title><!-- O\'Brien &amp; Co. &quot;Team&quot; -->'
            );
        });
    });

    suite('loadTemplateRaw / renderTemplate', () => {
        const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        let templatesDir: string;

        setup(() => {
            templatesDir = path.join(fixturesPath, `temp-templates-${Date.now()}-${Math.random().toString(36).slice(2)}`);
            fs.mkdirSync(templatesDir, { recursive: true });
        });

        teardown(() => {
            fs.rmSync(templatesDir, { recursive: true, force: true });
        });

        test('loadTemplateRaw should return undefined when no matching template file exists', async () => {
            const raw = await loadTemplateRaw(templatesDir, 'concept', '.dita');
            assert.strictEqual(raw, undefined);
        });

        test('loadTemplateRaw should return the file content unmodified when a template exists', async () => {
            fs.writeFileSync(path.join(templatesDir, 'concept.dita'), '<concept id="{{id}}"/>', 'utf8');
            const raw = await loadTemplateRaw(templatesDir, 'concept', '.dita');
            assert.strictEqual(raw, '<concept id="{{id}}"/>');
        });

        test('loadTemplateRaw should return undefined for an empty or whitespace-only template file (regression)', async () => {
            fs.writeFileSync(path.join(templatesDir, 'empty.dita'), '', 'utf8');
            fs.writeFileSync(path.join(templatesDir, 'blank.dita'), '   \n\t  ', 'utf8');

            assert.strictEqual(await loadTemplateRaw(templatesDir, 'empty', '.dita'), undefined);
            assert.strictEqual(await loadTemplateRaw(templatesDir, 'blank', '.dita'), undefined);
        });

        test('renderTemplate should return undefined when no matching template exists (caller falls back)', async () => {
            const result = await renderTemplate(templatesDir, 'task', '.dita', { id: 'x' });
            assert.strictEqual(result, undefined);
        });

        test('renderTemplate should load and substitute in one step', async () => {
            fs.writeFileSync(
                path.join(templatesDir, 'task.dita'),
                '<task id="{{id}}"><title>{{title}}</title></task>',
                'utf8'
            );
            const result = await renderTemplate(templatesDir, 'task', '.dita', { id: 'my-task', title: 'My Task' });
            assert.strictEqual(result, '<task id="my-task"><title>My Task</title></task>');
        });
    });
});
