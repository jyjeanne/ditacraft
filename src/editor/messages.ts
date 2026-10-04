/**
 * Host ⇄ webview protocol of the visual editor (spec §13.1, Appendix C).
 *
 * Imported by the extension host and by the editor page (webview/editor/main.ts), so it
 * must stay free of `vscode` and Node imports.
 */

import type { Grammar } from '../shared/grammar/types';
import type { LinkTarget } from '../shared/editor/links';
import type { ProblemItem } from '../shared/editor/problems';
import type { ResolvedItem } from '../shared/editor/reused';
import type { TextEdit } from '../shared/editor/sourceChange';
import type { EditMessage } from '../shared/editor/sync';

export interface EditorSettings {
    pageWidth: number;
    theme: 'auto' | 'light' | 'dark';
    showMarkup: boolean;
}

/** An element around the cursor on the page (Properties pane), innermost first. */
export interface SelectedElement {
    name: string;
    /** Position of the element's node in the page's document (-1 for formatting marks). */
    pos: number;
    /** Instance attributes, decoded. */
    xml: [string, string][];
    editable: boolean;
    /** Why it is not editable: 'formatting' (a mark), 'readOnly'. */
    reason?: string;
}

export type HostToEditor =
    /** (Re)start the editor on `text` at document `version`, with the grammar to edit it. */
    | {
        type: 'init'; version: number; text: string; grammar: Grammar; grammarLabel: string; fallback: boolean;
        fileName: string; locale: string; settings: EditorSettings; readOnly: boolean;
    }
    /** The document changed outside the editor (or an edit was refused): rebuild from it. */
    | { type: 'update'; version: number; text: string }
    /** The in-flight edit was applied; the document is at `version`. */
    | { type: 'ack'; version: number }
    | { type: 'settings'; settings: EditorSettings }
    /**
     * Properties pane: set the attributes of the element at `pos`, as the page reported it at
     * `stamp`. After a later change, applied only if `pos` still holds that element with the
     * attributes `before` (an attribute change does not move anything); otherwise refused and
     * the selection re-reported.
     */
    | { type: 'setAttributes'; stamp: number; pos: number; name: string; before: [string, string][]; xml: [string, string][] }
    /**
     * The document's diagnostics (spec §11.1), as offsets in its text at `version` (hints left
     * out). Sent when they change.
     */
    | { type: 'problems'; version: number; items: ProblemItem[] }
    /**
     * Answer to `reuse`: the copy's source for Replace with copy (`xml`), done for Open source,
     * or why not (`error`).
     */
    | { type: 'reuseResult'; request: number; xml?: string; error?: string }
    /**
     * Sync with the text editor: show source offset `offset` (of the text at `version`) — move
     * the page's cursor there (`cursor`, kept in view; `focus`: also focus the page), or scroll
     * it to the top of the page (`scroll`).
     */
    | { type: 'reveal'; version: number; offset: number; mode: SyncMode; focus?: boolean }
    /** Whether the page reports its cursor and scrolling (a text editor shows the document, sync is on). */
    | { type: 'syncState'; enabled: boolean }
    /** Ask for the source offset of the page's cursor (Open Source handoff); answered by `cursor`. */
    | { type: 'cursorRequest'; request: number }
    /** Answer to `clipboardRead`: the clipboard's text ('' when empty or unreadable). */
    | { type: 'clipboardText'; request: number; text: string }
    /**
     * Answer to `pickImage`, `imageFiles` and `saveImage`: the hrefs to use (relative to the topic;
     * none: cancelled or no image), the alternative text asked for, or why it failed.
     */
    | { type: 'images'; request: number; hrefs: string[]; alt?: string; error?: string }
    /** Answer to `askText`: what was typed (undefined: cancelled). */
    | { type: 'text'; request: number; value?: string }
    /** Answer to `pickLink`: the chosen target (undefined: cancelled). */
    | { type: 'link'; request: number; target?: LinkTarget }
    /** The map context the topic is shown in (spec §13.8 M4), for the status line (no label: none to show). */
    | { type: 'mapContext'; label?: string; title?: string }
    /** The reused content of the document's reuse elements (offsets in its text at `version`); sent when it may have changed. */
    | { type: 'resolved'; version: number; items: ResolvedItem[] }
    /** Answer to `quickFixes`: the fixes the language server offers (none: an empty list), or why there are none (`stale`). */
    | { type: 'quickFixes'; request: number; fixes?: QuickFixItem[]; error?: string }
    /**
     * Answer to `quickFix`: the fix's text edits, offsets of the text at the version the page
     * gave, for the page to make as its own change (`edits`); or the fix was applied to the
     * document (`applied`: the page follows the document as after a change in the text editor);
     * or why not (`stale`: the document changed since the fixes were listed).
     */
    | { type: 'quickFixResult'; request: number; edits?: TextEdit[]; applied?: boolean; error?: string }
    /**
     * Integration tests only (sent by an internal command): edit through real editor
     * transactions — type `text` after the first occurrence of `search`, undo, run a reuse
     * action on the `index`-th reused element (as its buttons do), scroll the page to `y`, or run
     * the right-click menu's item `id` with the cursor after `search` (or `search` selected), or
     * paste image `data` (base64) with the cursor after `search`, as a pasted screenshot, or
     * with the cursor after `search` list the quick fixes and make the first whose title contains
     * `title` (as Ctrl+. and a click do), or in a map select the row whose line shows `label` (as a
     * click on it), then fold or unfold it, run the right-click menu's item `id`, press `key` (`F2`
     * with `text`: the label typed and Enter), or drop it on another row or a cell (as a drag ends), or
     * select the cell (`row`, `col`) of the map's first relationship table (row -1: its header), then
     * press `key` or run the right-click menu's item `id`.
     */
    | { type: 'debug'; action: 'insertAfter'; search: string; text: string }
    | { type: 'debug'; action: 'undo' }
    | { type: 'debug'; action: 'reuse'; index: number; reuse: ReuseAction }
    | { type: 'debug'; action: 'scroll'; y: number }
    | { type: 'debug'; action: 'menu'; search: string; select?: boolean; id: string }
    | { type: 'debug'; action: 'pasteImage'; search: string; data: string; mime: string }
    | { type: 'debug'; action: 'quickFix'; search: string; title: string }
    | { type: 'debug'; action: 'row'; label: string; fold?: boolean; id?: string; key?: string; text?: string; drop?: { label?: string; cell?: [number, number]; place: 'before' | 'after' | 'inside' } }
    | { type: 'debug'; action: 'cell'; row: number; col: number; key?: string; id?: string };

/** A quick fix the language server offers for problems on the page (spec §11.1). */
export interface QuickFixItem {
    /** Its number in the last list the host sent. */
    id: number;
    title: string;
    /** The fix the server recommends. */
    preferred?: boolean;
}

/** What to do with reused content (spec §13.7). */
export type ReuseAction = 'open' | 'copy';

export type { ResolvedItem, TextEdit };

/** Cursor sync (follow the other side's cursor) or scroll sync (follow its top line). */
export type SyncMode = 'cursor' | 'scroll';

export type EditorToHost =
    | { type: 'ready' }
    | EditMessage
    /** Open the text editor beside, at a source offset of the current text. */
    | { type: 'openSource'; offset?: number }
    /** The elements around the cursor changed (or their attributes); `stamp` changes with the document. */
    | { type: 'selection'; stamp: number; chain: SelectedElement[] }
    | { type: 'command'; command: 'preview' | 'toggleMarkup' | 'properties' | 'mapContext' }
    /**
     * Reused content: open its source, or get a copy of it. The element starts at `offset` in
     * the document's text at `version` (the host refuses another version).
     */
    | { type: 'reuse'; action: ReuseAction; request: number; version: number; offset: number }
    /**
     * The quick fixes for problems the page shows: `problems` are indices in the `problems`
     * message of `version` (the problems at the cursor).
     */
    | { type: 'quickFixes'; request: number; version: number; problems: number[] }
    /**
     * Make fix `id` of the last list. A fix that only edits this topic is answered with its edits
     * (the page makes them, so undo on the page takes them back); `direct`, or any other fix (a
     * command, other files), is applied to the document by the host. `version`: the page's text.
     */
    | { type: 'quickFix'; request: number; id: number; version: number; direct?: boolean }
    /** How many diagnostics the page shows marks for (diagnostics, tests). */
    | { type: 'problemMarks'; count: number }
    /** The text of the reused content the page shows, box by box (diagnostics, tests). */
    | { type: 'resolvedShown'; texts: string[] }
    /** The page's cursor moved (`cursor`) or the page scrolled (`scroll`: its top) to source offset `offset` of the text at `version`. */
    | { type: 'sync'; version: number; offset: number; mode: SyncMode }
    /** Answer to `cursorRequest`: the source offset of the page's cursor in the current text. */
    | { type: 'cursor'; request: number; offset?: number }
    /** Paste from the right-click menu where the page may not read the clipboard: the host reads its text. */
    | { type: 'clipboardRead'; request: number }
    /** Let the author pick an image file (near `near`, an href of the topic), and ask its alternative text (`askAlt`). */
    | { type: 'pickImage'; request: number; askAlt: boolean; near?: string }
    /** Files dropped on the page (URIs): the hrefs of those that are images. */
    | { type: 'imageFiles'; request: number; uris: string[] }
    /** A pasted (or dropped) image's bytes, base64: save it next to the topic, answer its href. */
    | { type: 'saveImage'; request: number; data: string; mime: string; name?: string }
    /** Ask the author for a line of text (alternative text). */
    | { type: 'askText'; request: number; prompt: string; value: string; placeHolder?: string }
    /** Let the author choose a link target (`current`: the link's present one; `map`: a map's reference). */
    | { type: 'pickLink'; request: number; current?: LinkTarget; mode?: 'map' }
    /**
     * Open what a link points to. From a map's row: `from` is the row's element offset in the text
     * at `version` — the opened topic is then shown in that place of the map (spec §13.8 M4).
     */
    | { type: 'openLink'; target: LinkTarget; from?: number; version?: number }
    | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };
