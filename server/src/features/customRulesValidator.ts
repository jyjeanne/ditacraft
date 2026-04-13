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

/** Maximum match iterations per regex rule (prevents infinite-loop patterns). */
const MAX_MATCHES_PER_RULE = 10_000;

/** Maximum milliseconds a single rule may spend matching before being aborted. */
const RULE_TIMEOUT_MS = 2_000;

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
 * Detect regex patterns vulnerable to catastrophic backtracking (ReDoS).
 *
 * Checks for the most common ReDoS antipattern: nested quantifiers — a
 * quantifier applied to a group that itself contains a quantifier
 * (e.g. `(a+)+`, `(.*)*`, `(\w+)+`).
 *
 * Note: does not detect overlapping alternation (`(a|ab)+`) which can also
 * cause backtracking in some engines. V8 has built-in mitigations for many
 * of those cases, and accurate detection requires full regex parsing.
 *
 * Returns `true` when the pattern appears safe, `false` when it looks vulnerable.
 */
export function isSafeRegex(pattern: string): boolean {
    // Strip character classes [...] so their contents don't confuse the analysis.
    // Character classes can contain + * etc. as literals.
    const stripped = pattern.replace(/\[(?:[^\]\\]|\\.)*\]/g, 'X');

    // Match groups that contain quantifiers and are themselves quantified.
    // This catches (a+)+, (a+)*, (a+){2,}, (?:a+)+ etc.
    const nestedQuantifier = /\((?:[^()]*[+*])[^()]*\)[+*{]/;
    if (nestedQuantifier.test(stripped)) {
        return false;
    }

    // Check for nested groups with inner quantifiers then outer quantifiers.
    // e.g., ((?:a+)b)+ — inner group has a+, outer group is quantified
    const deepNested = /\([^)]*\([^)]*[+*][^)]*\)[^)]*\)[+*{]/;
    if (deepNested.test(stripped)) {
        return false;
    }

    return true;
}

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
            if (!isSafeRegex(def.pattern)) {
                console.warn(`[custom-rules] Rule "${def.id}" has a potentially unsafe regex (ReDoS risk) — skipped`);
                continue;
            }
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
        let matchCount = 0;
        const ruleStart = Date.now();
        while ((match = rule.regex.exec(cleanText)) !== null && diagnostics.length < maxProblems) {
            matchCount++;
            if (matchCount > MAX_MATCHES_PER_RULE) {
                console.warn(`[custom-rules] Rule "${rule.def.id}" exceeded ${MAX_MATCHES_PER_RULE} matches — aborting rule`);
                break;
            }
            if (Date.now() - ruleStart > RULE_TIMEOUT_MS) {
                console.warn(`[custom-rules] Rule "${rule.def.id}" exceeded ${RULE_TIMEOUT_MS}ms timeout — aborting rule`);
                break;
            }
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
