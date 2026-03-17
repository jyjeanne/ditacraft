/**
 * Comment-Based Suppression Engine.
 *
 * Parses inline suppression comments from DITA documents and filters diagnostics
 * based on range-based and file-level suppression directives.
 *
 * Supported comment directives:
 *   <!-- ditacraft-disable CODE1 CODE2 -->   starts suppression for CODE(s)
 *   <!-- ditacraft-enable CODE1 CODE2 -->    ends suppression for CODE(s)
 *   <!-- ditacraft-disable-file CODE1 -->    suppresses CODE(s) for entire file
 */

import { Diagnostic } from 'vscode-languageserver/node';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SuppressionRange {
    code: string;
    startLine: number;
    endLine: number; // Infinity if never re-enabled
}

interface SuppressionState {
    fileSuppressed: Set<string>;
    ranges: SuppressionRange[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Regex matching ditacraft suppression comments. */
const SUPPRESS_COMMENT_RE = /<!--\s*ditacraft-(disable|enable|disable-file)\s+([\w-]+(?:\s+[\w-]+)*)\s*-->/g;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse suppression comments from document text and build a structure
 * that can quickly test whether a diagnostic at a given line is suppressed.
 *
 * Uses CRLF-aware line counting (\n, \r\n, standalone \r) matching LSP line numbering.
 * The endLine of a suppression range is exclusive — the enable comment line itself is NOT suppressed.
 */
export function parseSuppressions(text: string): SuppressionState {
    const fileSuppressed = new Set<string>();
    const ranges: SuppressionRange[] = [];

    // Pre-compute line start offsets for binary-search offset→line mapping
    const lineStarts: number[] = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\r') {
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++; // Skip \n in \r\n pair
            }
            lineStarts.push(i + 1);
        } else if (text[i] === '\n') {
            lineStarts.push(i + 1);
        }
    }

    function offsetToLine(offset: number): number {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
        }
        return lo;
    }

    // Collect all suppression comments
    let match: RegExpExecArray | null;
    SUPPRESS_COMMENT_RE.lastIndex = 0; // Reset global regex state
    const openDisables = new Map<string, number>();

    while ((match = SUPPRESS_COMMENT_RE.exec(text)) !== null) {
        const action = match[1]; // 'disable' | 'enable' | 'disable-file'
        const codes = match[2].split(/\s+/).filter(Boolean);
        const line = offsetToLine(match.index);

        if (action === 'disable-file') {
            for (const code of codes) fileSuppressed.add(code);
        } else if (action === 'disable') {
            for (const code of codes) {
                if (!openDisables.has(code)) {
                    openDisables.set(code, line);
                }
            }
        } else { // enable
            for (const code of codes) {
                const startLine = openDisables.get(code);
                if (startLine !== undefined) {
                    ranges.push({ code, startLine, endLine: line });
                    openDisables.delete(code);
                }
            }
        }
    }

    // Close any unclosed disable directives (suppress to end of file)
    for (const [code, startLine] of openDisables) {
        ranges.push({ code, startLine, endLine: Infinity });
    }

    return { fileSuppressed, ranges };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filter diagnostics based on comment-based suppression directives.
 * Returns a new array with suppressed diagnostics removed.
 */
export function applySuppressions(diagnostics: Diagnostic[], text: string): Diagnostic[] {
    const state = parseSuppressions(text);
    if (state.fileSuppressed.size === 0 && state.ranges.length === 0) {
        return diagnostics;
    }

    return diagnostics.filter(d => {
        const code = typeof d.code === 'string' ? d.code : String(d.code ?? '');
        if (!code) return true;

        // File-level suppression
        if (state.fileSuppressed.has(code)) return false;

        // Range-based suppression — check if diagnostic start line falls in any range
        // startLine is inclusive (disable comment line), endLine is exclusive (enable comment line)
        const line = d.range.start.line;
        for (const r of state.ranges) {
            if (r.code === code && line >= r.startLine && line < r.endLine) return false;
        }

        return true;
    });
}
