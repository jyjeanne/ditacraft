/**
 * Host ⇄ webview protocol of the Properties pane (spec §13.4).
 *
 * Imported by the extension host and by the pane's page (webview/properties/main.ts), so it
 * must stay free of `vscode` and Node imports.
 */

import type { PropertyField } from '../shared/editor/properties';

export interface PropertiesState {
    /** Which editor the pane follows. */
    source: 'visual' | 'text' | 'none';
    fileName?: string;
    /** The elements around the cursor, innermost first. */
    chain: { name: string; editable: boolean; reason?: string }[];
    /** Index in `chain` of the element shown. */
    selected: number;
    element?: { name: string; cls?: string; editable: boolean; reason?: string };
    fields: PropertyField[];
    /** Controlled values from the subject scheme, by attribute name. */
    suggestions: Record<string, string[]>;
    /** Shown instead of fields (no DITA editor, XML not well-formed…). */
    message?: string;
    ui: Record<string, string>;
}

export type HostToProperties =
    | { type: 'state'; state: PropertiesState }
    /** A change was refused (invalid value, document changed). */
    | { type: 'error'; name: string; message: string };

export type PropertiesToHost =
    | { type: 'ready' }
    /** Show another element of the chain (an ancestor). */
    | { type: 'select'; index: number }
    /** Set (or remove, with null) an attribute of chain[index], named `element` when the pane showed it. */
    | { type: 'set'; index: number; element: string; name: string; value: string | null };
