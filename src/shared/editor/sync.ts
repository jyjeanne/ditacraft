/**
 * Edit synchronization between the visual editor (webview) and the VS Code document (host),
 * spec §13.1.
 *
 * The host is the only writer. The editor sends one span edit at a time, stamped with the
 * document version it was computed against; while it is in flight, further typing only
 * updates the pending text, sent as one coalesced edit when the host acknowledges. A host
 * change the editor did not make (the text editor, undo in VS Code, format on save, a
 * refused edit) replaces everything with the host's text: the editor rebuilds from it.
 *
 * Environment-neutral; no timers (the caller decides when to call local()).
 */

import { minimalEdit, type SpanEdit } from './minimalEdit';

export interface EditMessage extends SpanEdit {
    type: 'edit';
    /** Document version the edit applies to. */
    baseVersion: number;
}

export class EditSync {
    /** Text the host has, at `version`. */
    private confirmed: string;
    private inFlight: { text: string } | undefined;
    private pending: string | undefined;

    constructor(text: string, private version: number) {
        this.confirmed = text;
    }

    get documentVersion(): number {
        return this.version;
    }

    /** True while an edit awaits the host's acknowledgement. */
    get busy(): boolean {
        return this.inFlight !== undefined;
    }

    /** The newest text the editor has produced (sent or not). */
    get latest(): string {
        return this.pending ?? this.inFlight?.text ?? this.confirmed;
    }

    /** The editor's document now serializes to `text`: the edit to send, if any. */
    local(text: string): EditMessage | undefined {
        if (this.inFlight) {
            this.pending = text;
            return undefined;
        }
        const span = minimalEdit(this.confirmed, text);
        if (!span) {
            this.pending = undefined;
            return undefined;
        }
        this.inFlight = { text };
        this.pending = undefined;
        return { type: 'edit', baseVersion: this.version, ...span };
    }

    /** The host applied the in-flight edit; the document is now at `version`. */
    ack(version: number): EditMessage | undefined {
        if (this.inFlight) {
            this.confirmed = this.inFlight.text;
        }
        this.version = version;
        this.inFlight = undefined;
        const pending = this.pending;
        this.pending = undefined;
        return pending !== undefined ? this.local(pending) : undefined;
    }

    /**
     * The host's document changed by itself (or refused an edit): its text wins. Returns
     * true when the editor must rebuild from `text` (false: it already shows exactly that).
     */
    external(version: number, text: string): boolean {
        const same = text === this.latest && !this.inFlight && this.pending === undefined;
        this.confirmed = text;
        this.version = version;
        this.inFlight = undefined;
        this.pending = undefined;
        return !same;
    }
}
