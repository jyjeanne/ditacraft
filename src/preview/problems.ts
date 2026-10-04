/**
 * LSP diagnostics → page problem marks (spec §11.1).
 *
 * Each diagnostic is mapped to the chain of elements containing its start offset,
 * innermost first; the page marks the first one that is actually rendered (hidden
 * metadata falls back to a visible ancestor).
 *
 * No `vscode` import.
 */

import type { ElementIndex } from '../shared/cst/elementIndex';
import type { Problem } from './messages';

export interface DiagnosticLike {
    /** Offset of the diagnostic's start in the document text. */
    start: number;
    /** 1-based line, for the tooltip. */
    line: number;
    severity: Problem['severity'];
    message: string;
    code?: string;
    source?: string;
}

const ORDER: Record<Problem['severity'], number> = { error: 0, warning: 1, info: 2, hint: 3 };

export function mapProblems(diagnostics: readonly DiagnosticLike[], index: ElementIndex): Problem[] {
    return diagnostics
        .filter((d) => d.severity !== 'hint')
        .map((d) => ({
            ids: index.chainAt(d.start),
            severity: d.severity,
            message: d.message,
            code: d.code,
            source: d.source,
            line: d.line,
        }))
        .filter((p) => p.ids.length > 0)
        .sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.line - b.line);
}
