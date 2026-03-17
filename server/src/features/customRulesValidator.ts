/**
 * Custom Rules Validator (Phase 6).
 * Loads user-defined regex-based validation rules from a JSON file
 * and runs them as an additional pipeline phase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { stripCommentsAndCDATA, offsetToRange } from '../utils/textUtils';

const SOURCE = 'custom-rules';

/** Severity names accepted in custom rule definitions. */
type SeverityName = 'error' | 'warning' | 'information' | 'hint';

const SEVERITY_NAME_MAP: Record<SeverityName, DiagnosticSeverity> = {
    error: DiagnosticSeverity.Error,
    warning: DiagnosticSeverity.Warning,
    information: DiagnosticSeverity.Information,
    hint: DiagnosticSeverity.Hint,
};

/** A single custom rule as defined in the user's JSON file. */
export interface CustomRuleDefinition {
    id: string;
    description?: string;
    pattern: string;
    severity: SeverityName;
    message: string;
    fileTypes?: string[];
}

/** The shape of the custom rules JSON file. */
export interface CustomRulesFile {
    rules: CustomRuleDefinition[];
}

/** A compiled custom rule ready for execution. */
interface CompiledRule {
    def: CustomRuleDefinition;
    regex: RegExp;
    severity: DiagnosticSeverity;
    fileTypeSet: Set<string> | null; // null = all file types
}

/** Cache of compiled rules per file path. */
let cachedFilePath: string | null = null;
let cachedMtime: number = 0;
let cachedRules: CompiledRule[] = [];

/**
 * Load and compile custom rules from the given file path.
 * Uses mtime-based caching to avoid re-parsing on every validation.
 */
function loadRules(filePath: string): CompiledRule[] {
    if (!filePath) return [];

    const resolved = path.resolve(filePath);

    // Check mtime for cache validity
    let stat: fs.Stats;
    try {
        stat = fs.statSync(resolved);
    } catch (e) {
        // File doesn't exist or not accessible — log for debugging
        console.warn(`[custom-rules] Cannot access rules file "${resolved}": ${e instanceof Error ? e.message : e}`);
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }

    if (resolved === cachedFilePath && stat.mtimeMs === cachedMtime) {
        return cachedRules;
    }

    // (Re)load and compile
    let content: string;
    try {
        content = fs.readFileSync(resolved, 'utf-8');
    } catch (e) {
        console.warn(`[custom-rules] Cannot read rules file "${resolved}": ${e instanceof Error ? e.message : e}`);
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }

    let parsed: CustomRulesFile;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        console.warn(`[custom-rules] Invalid JSON in rules file "${resolved}": ${e instanceof Error ? e.message : e}`);
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }

    if (!parsed.rules || !Array.isArray(parsed.rules)) {
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }

    const compiled: CompiledRule[] = [];
    for (const def of parsed.rules) {
        if (!def.id || !def.pattern || !def.message) continue;

        let regex: RegExp;
        try {
            regex = new RegExp(def.pattern, 'g');
        } catch {
            // Invalid regex — skip this rule
            continue;
        }

        const severity = SEVERITY_NAME_MAP[def.severity] ?? DiagnosticSeverity.Warning;
        const fileTypeSet = def.fileTypes && def.fileTypes.length > 0
            ? new Set(def.fileTypes.map(ft => ft.toLowerCase()))
            : null;

        compiled.push({ def, regex, severity, fileTypeSet });
    }

    cachedFilePath = resolved;
    cachedMtime = stat.mtimeMs;
    cachedRules = compiled;
    return compiled;
}

/**
 * Determine the DITA file type from the file path and content.
 * Returns a lowercase type string like 'topic', 'concept', 'task', 'reference', 'map', 'bookmap'.
 */
function detectFileType(filePath: string, text: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.bookmap' || /<bookmap[\s>]/.test(text)) return 'bookmap';
    if (ext === '.ditamap') return 'map';

    // Detect root element from content
    const rootMatch = text.match(/<(concept|task|reference|topic|glossentry|troubleshooting)\b/);
    if (rootMatch) return rootMatch[1].toLowerCase();

    return 'topic'; // default fallback
}

/**
 * Validate a document against custom user-defined rules.
 *
 * @param text       Raw document text
 * @param filePath   File system path of the document
 * @param rulesFile  Path to the custom rules JSON file (from settings)
 * @param maxProblems Maximum diagnostics to return
 */
export function validateCustomRules(
    text: string,
    filePath: string,
    rulesFile: string,
    maxProblems: number,
): Diagnostic[] {
    const rules = loadRules(rulesFile);
    if (rules.length === 0) return [];

    const cleanText = stripCommentsAndCDATA(text);
    const fileType = detectFileType(filePath, text);
    const diagnostics: Diagnostic[] = [];

    for (const rule of rules) {
        if (diagnostics.length >= maxProblems) break;

        // Filter by file type
        if (rule.fileTypeSet && !rule.fileTypeSet.has(fileType)) continue;

        // Reset regex state for each document
        rule.regex.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = rule.regex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            const range = offsetToRange(text, match.index, match.index + match[0].length);
            diagnostics.push({
                severity: rule.severity,
                range,
                message: rule.def.message,
                code: rule.def.id,
                source: SOURCE,
            });
        }
    }

    return diagnostics;
}

/**
 * Clear the cached rules (e.g., when settings change).
 */
export function clearCustomRulesCache(): void {
    cachedFilePath = null;
    cachedMtime = 0;
    cachedRules = [];
}
