/**
 * Settings of the MCP server.
 *
 * The MCP server has no VS Code client to ask for its configuration. It starts from
 * defaultMcpSettings() and applies, in this order:
 * 1. the `ditacraft.*` settings of a VS Code settings file — `DITACRAFT_SETTINGS_FILE`, or
 *    `<workspace>/.vscode/settings.json` when it exists, so the server validates as the
 *    extension does in that workspace;
 * 2. the environment variables `DITACRAFT_XML_CATALOG` (xmlCatalogPath) and
 *    `DITACRAFT_CUSTOM_RULES_FILE` (customRulesFile).
 * Path settings may be relative to the workspace or start with `${workspaceFolder}`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DitaCraftSettings } from '../../server/src/settings';

export function defaultMcpSettings(): DitaCraftSettings {
    return {
        autoValidate: false,
        validationDebounceMs: 0,
        validationEngine: 'typesxml',
        keySpaceCacheTtlMinutes: 5,
        maxLinkMatches: 10000,
        maxNumberOfProblems: 100,
        logLevel: 'warn',
        ditaRulesEnabled: true,
        ditaRulesCategories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
        crossRefValidationEnabled: true,
        subjectSchemeValidationEnabled: true,
        ditaVersion: 'auto',
        schemaFormat: 'dtd',
        rngSchemaPath: '',
        xmlCatalogPath: '',
        validationSeverityOverrides: {},
        customRulesFile: '',
        largeFileThresholdKB: 500,
        pipelineBudgetMs: 30_000,
    };
}

/** Editor behavior with no meaning in the MCP server: not read from a settings file. */
const EDITOR_ONLY_SETTINGS = new Set(['autoValidate', 'validationDebounceMs', 'logLevel']);

/** Settings holding a file path: resolved against the workspace. */
const PATH_SETTINGS = ['xmlCatalogPath', 'customRulesFile', 'rngSchemaPath'] as const;

const SETTING_PREFIX = 'ditacraft.';

export interface LoadedMcpSettings {
    settings: DitaCraftSettings;
    /** The settings file applied, if one was found and read. */
    settingsFile?: string;
    /** Problems met while loading (unreadable file, value of the wrong type…), for the log. */
    warnings: string[];
}

export function loadMcpSettings(workspaceRoot: string, env: NodeJS.ProcessEnv = process.env): LoadedMcpSettings {
    const settings = defaultMcpSettings();
    const values = settings as unknown as Record<string, unknown>;
    const warnings: string[] = [];

    const explicitFile = env.DITACRAFT_SETTINGS_FILE?.trim();
    const candidate = explicitFile
        ? resolveSettingPath(explicitFile, workspaceRoot)
        : path.join(workspaceRoot, '.vscode', 'settings.json');
    let settingsFile: string | undefined;

    if (fs.existsSync(candidate)) {
        try {
            const parsed: unknown = JSON.parse(stripJsonComments(fs.readFileSync(candidate, 'utf-8')));
            if (!isPlainObject(parsed)) {
                throw new Error('the file does not hold a JSON object');
            }
            for (const [name, value] of Object.entries(parsed)) {
                if (!name.startsWith(SETTING_PREFIX)) continue;
                const key = name.slice(SETTING_PREFIX.length);
                if (!(key in values) || EDITOR_ONLY_SETTINGS.has(key)) continue;
                if (!sameKind(values[key], value)) {
                    warnings.push(`${name} ignored: expected ${kindOf(values[key])}, found ${kindOf(value)}`);
                    continue;
                }
                values[key] = value;
            }
            settingsFile = candidate;
        } catch (error: unknown) {
            warnings.push(`Settings file "${candidate}" ignored: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else if (explicitFile) {
        warnings.push(`Settings file not found: "${candidate}" (DITACRAFT_SETTINGS_FILE)`);
    }

    const catalog = env.DITACRAFT_XML_CATALOG?.trim();
    if (catalog) settings.xmlCatalogPath = catalog;
    const rules = env.DITACRAFT_CUSTOM_RULES_FILE?.trim();
    if (rules) settings.customRulesFile = rules;

    for (const key of PATH_SETTINGS) {
        if (settings[key]) {
            settings[key] = resolveSettingPath(settings[key], workspaceRoot);
        }
    }
    if (settings.xmlCatalogPath && !fs.existsSync(settings.xmlCatalogPath)) {
        warnings.push(`XML catalog not found: "${settings.xmlCatalogPath}" — the bundled DITA catalog is used`);
    }
    if (settings.customRulesFile && !fs.existsSync(settings.customRulesFile)) {
        warnings.push(`Custom rules file not found: "${settings.customRulesFile}"`);
    }

    return { settings, settingsFile, warnings };
}

/** Resolve a path setting: `${workspaceFolder}` expanded, relative paths taken from the workspace. */
export function resolveSettingPath(value: string, workspaceRoot: string): string {
    const expanded = value.replace(/\$\{workspaceFolder\}/g, workspaceRoot);
    return path.resolve(workspaceRoot, expanded);
}

/**
 * Remove the comments and trailing commas that VS Code settings files allow
 * (JSON with comments), leaving string contents untouched.
 */
export function stripJsonComments(text: string): string {
    let withoutComments = '';
    for (let i = 0; i < text.length;) {
        const ch = text[i];
        if (ch === '"') {
            const end = stringEnd(text, i);
            withoutComments += text.slice(i, end);
            i = end;
        } else if (ch === '/' && text[i + 1] === '/') {
            while (i < text.length && text[i] !== '\n') i++;
        } else if (ch === '/' && text[i + 1] === '*') {
            const close = text.indexOf('*/', i + 2);
            i = close < 0 ? text.length : close + 2;
        } else {
            withoutComments += ch;
            i++;
        }
    }

    let result = '';
    for (let i = 0; i < withoutComments.length;) {
        const ch = withoutComments[i];
        if (ch === '"') {
            const end = stringEnd(withoutComments, i);
            result += withoutComments.slice(i, end);
            i = end;
            continue;
        }
        if (ch === ',') {
            let next = i + 1;
            while (next < withoutComments.length && /\s/.test(withoutComments[next])) next++;
            if (withoutComments[next] === '}' || withoutComments[next] === ']') {
                i++;
                continue;
            }
        }
        result += ch;
        i++;
    }
    return result;
}

/** Index just past the JSON string starting at `start` (a double quote). */
function stringEnd(text: string, start: number): number {
    let i = start + 1;
    while (i < text.length) {
        if (text[i] === '\\') {
            i += 2;
        } else if (text[i] === '"') {
            return i + 1;
        } else {
            i++;
        }
    }
    return text.length;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function kindOf(value: unknown): string {
    if (Array.isArray(value)) return 'an array';
    if (value === null) return 'null';
    if (typeof value === 'object') return 'an object';
    return `a ${typeof value}`;
}

function sameKind(expected: unknown, actual: unknown): boolean {
    return kindOf(expected) === kindOf(actual);
}
