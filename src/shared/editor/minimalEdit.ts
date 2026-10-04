/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/edit-bridge.ts
 * (minimalEdit, SpanEdit).
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted; applySpanEdit added.
 */

/**
 * The single span edit that turns one source text into another (spec §13.1): the common
 * prefix and suffix are stripped, so a visual edit reaches VS Code as one small
 * replacement — clean Git diffs, granular undo in the text editor.
 *
 * Environment-neutral.
 */

export interface SpanEdit {
    /** Replace source[start, end) with text. Offsets into the OLD source. */
    start: number;
    end: number;
    text: string;
}

/** Smallest single-span edit transforming `oldStr` into `newStr`; null if they are equal. */
export function minimalEdit(oldStr: string, newStr: string): SpanEdit | null {
    if (oldStr === newStr) {
        return null;
    }
    const max = Math.min(oldStr.length, newStr.length);
    let start = 0;
    while (start < max && oldStr.charCodeAt(start) === newStr.charCodeAt(start)) {
        start++;
    }
    let endOld = oldStr.length;
    let endNew = newStr.length;
    while (endOld > start && endNew > start && oldStr.charCodeAt(endOld - 1) === newStr.charCodeAt(endNew - 1)) {
        endOld--;
        endNew--;
    }
    return alignToReference(oldStr, { start, end: endOld, text: newStr.slice(start, endNew) });
}

/**
 * Deleting or inserting text next to a repeat can be placed at several offsets that give the same
 * result (deleting the first `&gt;` of `&gt;&lt;` is also deleting `gt;&`). When the span starts
 * inside a character or entity reference and the same edit can start at its `&`, it starts there:
 * the edit is whole references.
 */
function alignToReference(oldStr: string, span: SpanEdit): SpanEdit {
    const deletion = span.text === '';
    const insertion = span.start === span.end;
    if (deletion === insertion) {
        return span; // a replacement: its place is not ambiguous
    }
    const amp = oldStr.lastIndexOf('&', span.start - 1);
    const d = span.start - amp;
    if (amp < 0 || d > 12 || !/^&[#\w.:-]*$/.test(oldStr.slice(amp, span.start))) {
        return span;
    }
    if (deletion && oldStr.slice(amp, span.start) === oldStr.slice(span.end - d, span.end)) {
        return { start: amp, end: span.end - d, text: '' };
    }
    if (insertion && span.text.length >= d && oldStr.slice(amp, span.start) === span.text.slice(span.text.length - d)) {
        return { start: amp, end: amp, text: oldStr.slice(amp, span.start) + span.text.slice(0, span.text.length - d) };
    }
    return span;
}

/** Apply a span edit to a text. */
export function applySpanEdit(text: string, edit: SpanEdit): string {
    return text.slice(0, edit.start) + edit.text + text.slice(edit.end);
}
