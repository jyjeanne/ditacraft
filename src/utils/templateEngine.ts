/**
 * Template Engine
 * Backs `ditacraft.templatesPath`: an optional directory of user-supplied
 * `.dita`/`.ditamap`/`.bookmap` template files, selected by a fixed naming
 * convention (`topic.dita`, `concept.dita`, `task.dita`, `reference.dita`,
 * `map.ditamap`, `bookmap.bookmap`) and rendered with `{{placeholder}}`
 * substitution.
 *
 * Deliberately a parallel code path, not a change to the existing
 * `generateTopicContent`/`generateMapContent`/`generateBookmapContent`
 * generators in `fileCreationCommands.ts` — those keep their current
 * zero-template behavior and tests untouched. Callers check
 * `loadTemplateRaw()`/`renderTemplate()`'s result and fall back to the
 * built-in generator when it returns `undefined` (no `ditacraft.
 * templatesPath` configured, no template file matching the requested name,
 * or an empty/whitespace-only template file).
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { escapeXml } from './xmlUtils';
import { substituteWorkspaceFolderVar } from './pathUtils';

/** Values substituted for `{{name}}` placeholders in a template file. */
export interface TemplateVariables {
    id: string;
    title?: string;
    author?: string;
    date?: string;
}

/**
 * Resolve the configured `ditacraft.templatesPath` to an absolute
 * directory. Returns undefined when unset, when it's relative with no
 * workspace folder open to resolve it against, or when it uses the
 * `${workspaceFolder}` placeholder with no workspace open — the
 * placeholder is meaningless in that case, and substituting it with an
 * empty string would silently produce an unrelated (and on POSIX,
 * accidentally-absolute-looking) path rather than the "not configured"
 * result callers expect.
 */
export function resolveTemplatesDir(templatesPath: string | undefined): string | undefined {
    if (!templatesPath || templatesPath.trim().length === 0) {
        return undefined;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (templatesPath.includes('${workspaceFolder}')) {
        return workspaceFolder ? substituteWorkspaceFolderVar(templatesPath) : undefined;
    }
    if (path.isAbsolute(templatesPath)) {
        return templatesPath;
    }
    return workspaceFolder ? path.join(workspaceFolder, templatesPath) : undefined;
}

/**
 * Substitute `{{name}}` placeholders (tolerating internal whitespace, e.g.
 * `{{ title }}`) with the matching value from `variables`, XML-escaping
 * each value first (these substitute directly into DITA XML content).
 * A placeholder with no matching key, or whose value is `undefined`, is
 * left untouched rather than replaced with an empty string — better to
 * leave a visible `{{author}}` an author can fill in by hand than to
 * silently produce blank content. An explicitly *empty* string value
 * (distinct from `undefined`) IS substituted, though — e.g. a user who
 * deliberately clears a prefilled title prompt gets an empty title, not a
 * literal `{{title}}` left in the generated file.
 */
export function substitutePlaceholders(content: string, variables: TemplateVariables): string {
    const values: Record<string, string | undefined> = { ...variables };
    return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
        const value = values[key];
        return value !== undefined ? escapeXml(value) : match;
    });
}

/**
 * Load the raw (unsubstituted) template for `baseName + extension` (e.g.
 * `('concept', '.dita')` → `<templatesDir>/concept.dita`) inside
 * `templatesDir`. Returns undefined — not a thrown error — when the file
 * doesn't exist, or exists but is empty/whitespace-only (an accidentally
 * truncated template should fall back to a valid built-in skeleton, not
 * silently produce a content-less file with no warning), so callers can
 * fall back to the built-in generator (or decide whether to prompt for
 * extra placeholder values, since it's only worth asking when a usable
 * template actually exists); any other read failure (permissions, etc.)
 * is rethrown since that's not the "no template configured" case.
 */
export async function loadTemplateRaw(
    templatesDir: string,
    baseName: string,
    extension: string
): Promise<string | undefined> {
    const templatePath = path.join(templatesDir, `${baseName}${extension}`);
    let raw: string;
    try {
        raw = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
            return undefined;
        }
        throw error;
    }
    return raw.trim().length > 0 ? raw : undefined;
}

/**
 * Convenience wrapper combining `loadTemplateRaw` + `substitutePlaceholders`
 * for callers that already have every variable in hand (e.g. `newBookmapCommand`,
 * which collects the book title before rendering anything, and the Project
 * Init Wizard) and don't need to branch on "does a template exist" first
 * (as `newTopicCommand`/`newMapCommand` do, to decide whether to prompt for
 * an extra title).
 */
export async function renderTemplate(
    templatesDir: string,
    baseName: string,
    extension: string,
    variables: TemplateVariables
): Promise<string | undefined> {
    const raw = await loadTemplateRaw(templatesDir, baseName, extension);
    return raw !== undefined ? substitutePlaceholders(raw, variables) : undefined;
}
