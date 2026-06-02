"use strict";
/**
 * Custom Rules Validator (Phase 6).
 * Loads user-defined regex-based validation rules from a JSON file
 * and runs them as an additional pipeline phase.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeRegex = isSafeRegex;
exports.validateCustomRules = validateCustomRules;
exports.clearCustomRulesCache = clearCustomRulesCache;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_1 = require("vscode-languageserver/node");
const textUtils_1 = require("../utils/textUtils");
const SOURCE = 'custom-rules';
/** Maximum match iterations per regex rule (prevents infinite-loop patterns). */
const MAX_MATCHES_PER_RULE = 10000;
/** Maximum milliseconds a single rule may spend matching before being aborted. */
const RULE_TIMEOUT_MS = 2000;
const SEVERITY_NAME_MAP = {
    error: node_1.DiagnosticSeverity.Error,
    warning: node_1.DiagnosticSeverity.Warning,
    information: node_1.DiagnosticSeverity.Information,
    hint: node_1.DiagnosticSeverity.Hint,
};
/** Cache of compiled rules per file path. */
let cachedFilePath = null;
let cachedMtime = 0;
let cachedRules = [];
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
function isSafeRegex(pattern) {
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
function loadRules(filePath) {
    if (!filePath)
        return [];
    const resolved = path.resolve(filePath);
    // Defense-in-depth: only allow .json files and reject suspicious paths
    if (path.extname(resolved).toLowerCase() !== '.json') {
        console.warn(`[custom-rules] Rejected rules file — must have .json extension: "${resolved}"`);
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }
    if (resolved.includes('\0')) {
        console.warn('[custom-rules] Rejected rules file — path contains null bytes');
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }
    // Check mtime for cache validity
    let stat;
    try {
        stat = fs.statSync(resolved);
    }
    catch (e) {
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
    let content;
    try {
        content = fs.readFileSync(resolved, 'utf-8');
    }
    catch (e) {
        console.warn(`[custom-rules] Cannot read rules file "${resolved}": ${e instanceof Error ? e.message : e}`);
        cachedFilePath = null;
        cachedRules = [];
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch (e) {
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
    const compiled = [];
    for (const def of parsed.rules) {
        if (!def.id || !def.pattern || !def.message)
            continue;
        let regex;
        try {
            if (!isSafeRegex(def.pattern)) {
                console.warn(`[custom-rules] Rule "${def.id}" has a potentially unsafe regex (ReDoS risk) — skipped`);
                continue;
            }
            regex = new RegExp(def.pattern, 'g');
        }
        catch {
            // Invalid regex — skip this rule
            continue;
        }
        const severity = SEVERITY_NAME_MAP[def.severity] ?? node_1.DiagnosticSeverity.Warning;
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
function detectFileType(filePath, text) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.bookmap' || /<bookmap[\s>]/.test(text))
        return 'bookmap';
    if (ext === '.ditamap')
        return 'map';
    // Detect root element from content
    const rootMatch = text.match(/<(concept|task|reference|topic|glossentry|troubleshooting)\b/);
    if (rootMatch)
        return rootMatch[1].toLowerCase();
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
function validateCustomRules(text, filePath, rulesFile, maxProblems) {
    const rules = loadRules(rulesFile);
    if (rules.length === 0)
        return [];
    const cleanText = (0, textUtils_1.stripCommentsAndCDATA)(text);
    const fileType = detectFileType(filePath, text);
    const diagnostics = [];
    for (const rule of rules) {
        if (diagnostics.length >= maxProblems)
            break;
        // Filter by file type
        if (rule.fileTypeSet && !rule.fileTypeSet.has(fileType))
            continue;
        // Reset regex state for each document
        rule.regex.lastIndex = 0;
        let match;
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
            const range = (0, textUtils_1.offsetToRange)(text, match.index, match.index + match[0].length);
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
function clearCustomRulesCache() {
    cachedFilePath = null;
    cachedMtime = 0;
    cachedRules = [];
}
//# sourceMappingURL=customRulesValidator.js.map