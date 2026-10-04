/**
 * Host ⇄ webview protocol of the visual preview (spec §10, Appendix C).
 *
 * Imported by the extension host and by the page script (webview/preview/main.ts), so it
 * must stay free of `vscode` and Node imports.
 */

export interface DocMeta {
    /** URI string of the previewed document (persisted by the page for panel revival). */
    uri: string;
    fileName: string;
    grammarId: string;
    grammarLabel: string;
    /** The document names no grammar the preview has; the composite grammar is used. */
    fallback: boolean;
    /** Basename of the active DITAVAL filter, if any. */
    ditaval?: string;
    /** The map context the topic is shown in (spec §13.8 M4): its place, or "no map context". */
    context?: { label: string; title: string };
    undeclaredEntities: number;
    unknownElements: number;
    /** References were not resolved (large document or setting off). */
    referencesSkipped?: boolean;
}

export interface Problem {
    /** Element ids containing the problem, innermost first; the page marks the first rendered one. */
    ids: string[];
    severity: 'error' | 'warning' | 'info' | 'hint';
    message: string;
    code?: string;
    source?: string;
    line: number;
}

/** top: align with the page top (editor scrolled); center: centre it (clicked); nearest: only if out of view (typing). */
export type RevealMode = 'top' | 'center' | 'nearest';

export interface PreviewSettings {
    pageWidth: number;
    showMarkup: boolean;
    syncEnabled: boolean;
    locked: boolean;
    theme: 'auto' | 'light' | 'dark';
    /** Localized page strings (labels.ts `ui`). */
    ui: Record<string, string>;
}

export type HostToWebview =
    | { type: 'settings'; settings: PreviewSettings }
    | { type: 'body'; version: number; html: string; meta: DocMeta; anchor?: string }
    | { type: 'patch'; version: number; items: { id: string; html: string }[] }
    | { type: 'problems'; version: number; items: Problem[] }
    | { type: 'reveal'; ids: string[]; mode: RevealMode; highlight: boolean }
    | { type: 'banner'; kind: 'parse' | 'info' | null; text?: string; line?: number }
    | { type: 'empty'; text: string };

export type OpenKind = 'source' | 'link' | 'reuse' | 'key' | 'line';

export type ToolbarCommand = 'refresh' | 'openSource' | 'toggleSync' | 'cycleTheme' | 'previewDitaOt' | 'toggleMarkup' | 'toggleLock' | 'chooseContext';

/**
 * Element ids are only meaningful for the parse they came from: messages carrying one also
 * carry the body `version` the page shows, and the host ignores them once it re-parsed.
 */
export type WebviewToHost =
    | { type: 'ready' }
    /** The page swapped in body `version`; `elements` counts the rendered data-struct-id elements. */
    | { type: 'rendered'; version: number; elements: number }
    | { type: 'scroll'; version: number; id: string }
    | { type: 'select'; version: number; id: string }
    | { type: 'open'; version: number; kind: OpenKind; id?: string; line?: number }
    | { type: 'command'; command: ToolbarCommand };
