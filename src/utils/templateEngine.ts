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
 * `renderTemplate()`'s result and fall back to the built-in generator when
 * it returns `undefined` (no `ditacraft.templatesPath` configured, or no
 * template file matching the requested name exists there).
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/** Values substituted for `{{name}}` placeholders in a template file. */
export interface TemplateVariables {
    id: string;
    title?: string;
    author?: string;
    date?: string;
}

/**
 * Resolve the configured `ditacraft.templatesPath` to an absolute
 * directory, substituting the `${workspaceFolder}` placeholder the same
 * way `ditacraft.outputDirectory` does (see `DitaOtWrapper.
 * loadConfiguration()` / `resolveProfileOutputDir()` in
 * `publishProfilesCommand.ts`). Returns undefined when unset, so callers
 * can treat "no templates configured" and "templates directory resolved
 * to nothing" the same way.
 */
export function resolveTemplatesDir(templatesPath: string | undefined): string | undefined {
    if (!templatesPath || templatesPath.trim().length === 0) {
        return undefined;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const substituted = templatesPath.replace('${workspaceFolder}', workspaceFolder ?? '');
    if (path.isAbsolute(substituted)) {
        return substituted;
    }
    if (!workspaceFolder) {
        return undefined;
    }
    return path.join(workspaceFolder, substituted);
}

/**
 * Substitute `{{name}}` placeholders (tolerating internal whitespace, e.g.
 * `{{ title }}`) with the matching value from `variables`. A placeholder
 * with no matching key, or whose value is undefined, is left untouched
 * rather than replaced with an empty string or `undefined` — better to
 * leave a visible `{{author}}` an author can fill in by hand than to
 * silently produce blank content.
 */
export function substitutePlaceholders(content: string, variables: TemplateVariables): string {
    const values: Record<string, string | undefined> = { ...variables };
    return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
        const value = values[key];
        return value !== undefined && value.length > 0 ? value : match;
    });
}

/**
 * Load the raw (unsubstituted) template for `baseName + extension` (e.g.
 * `('concept', '.dita')` → `<templatesDir>/concept.dita`) inside
 * `templatesDir`. Returns undefined — not a thrown error — when the file
 * doesn't exist, so callers can fall back to the built-in generator (or
 * decide whether to prompt for extra placeholder values, since it's only
 * worth asking when a template that could use them actually exists); any
 * other read failure (permissions, etc.) is rethrown since that's not the
 * "no template configured for this type" case.
 */
export async function loadTemplateRaw(
    templatesDir: string,
    baseName: string,
    extension: string
): Promise<string | undefined> {
    const templatePath = path.join(templatesDir, `${baseName}${extension}`);
    try {
        return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
            return undefined;
        }
        throw error;
    }
}

/**
 * Convenience wrapper combining `loadTemplateRaw` + `substitutePlaceholders`
 * for callers that already have every variable in hand (e.g. the Project
 * Init Wizard, which collects title/author before rendering anything) and
 * don't need to branch on "does a template exist" first.
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
