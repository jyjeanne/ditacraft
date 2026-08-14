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

        test('Should substitute ${workspaceFolder}', () => {
            const folder = vscode.workspace.workspaceFolders?.[0];
            const resolved = resolveTemplatesDir('${workspaceFolder}/templates');
            const expectedBase = folder ? folder.uri.fsPath : '';
            assert.strictEqual(resolved, `${expectedBase}/templates`);
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

        test('Should leave a placeholder untouched when its value is an empty string', () => {
            const result = substitutePlaceholders('{{id}} by {{author}}', { id: 'x', author: '' });
            assert.strictEqual(result, 'x by {{author}}');
        });

        test('Should leave unknown placeholder names untouched', () => {
            const result = substitutePlaceholders('{{id}} {{unknownThing}}', { id: 'x' });
            assert.strictEqual(result, 'x {{unknownThing}}');
        });

        test('Should substitute repeated placeholders every occurrence', () => {
            const result = substitutePlaceholders('{{id}}-{{id}}', { id: 'dup' });
            assert.strictEqual(result, 'dup-dup');
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
