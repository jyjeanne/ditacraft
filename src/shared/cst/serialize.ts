/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/serialize.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted to DitaCraft conventions; no behavioural change.
 */

/**
 * Serializer: clean nodes slice the original source (byte-identical); dirty or
 * synthetic nodes are rebuilt from their parts. Because clean subtrees are emitted
 * verbatim, an untouched document round-trips byte for byte, and an edit only
 * changes the bytes of the nodes it actually touched.
 *
 * Phase 1 (read-only preview) uses this only to prove the round-trip contract in
 * tests; the Phase 2 editor writes every edit through it.
 */

import type { Attr, CstNode, Document, ElementNode } from './types';

/** Escape text node content. The editor supplies decoded text; `&` first. */
export function escapeText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Escape an attribute value, including the quote character in use. */
export function escapeAttr(value: string, quote: '"' | "'"): string {
    const out = value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return quote === '"' ? out.replace(/"/g, '&quot;') : out.replace(/'/g, '&apos;');
}

function serializeNode(node: CstNode, source: string): string {
    if (!node.synthetic && !node.dirty) {
        return source.slice(node.range.start, node.range.end);
    }

    switch (node.type) {
        case 'text':
            if (node.newText !== undefined) {
                return escapeText(node.newText);
            }
            // Synthetic raw text (e.g. indentation) emits its raw verbatim; a real node slices.
            if (node.synthetic) {
                return node.raw;
            }
            return source.slice(node.range.start, node.range.end);

        case 'element':
            return serializeElement(node, source);

        // Markup the editor never mutates: a dirty flag here can only mean a
        // descendant changed, which is impossible for these leaf kinds.
        default:
            return source.slice(node.range.start, node.range.end);
    }
}

function serializeElement(el: ElementNode, source: string): string {
    const open = openTag(el, source);
    const inner = el.children.map((child) => serializeNode(child, source)).join('');
    if (inner === '') {
        // A self-closing element stays self-closing; a synthetic paired-empty element keeps
        // its paired form; a parsed element edited empty canonicalizes to `<tag/>`.
        if (el.selfClosing) {
            return open;
        }
        if (el.synthetic) {
            return `${open}</${el.name}>`;
        }
        return open.replace(/>$/, '/>');
    }
    // A self-closing element that gained children is promoted to <tag>…</tag>.
    const openNorm = el.selfClosing ? open.replace(/\s*\/>$/, '>') : open;
    let close: string;
    if (el.synthetic || el.selfClosing || !el.closeTagRange) {
        close = `</${el.name}>`;
    } else {
        close = source.slice(el.closeTagRange.start, el.closeTagRange.end);
    }
    return openNorm + inner + close;
}

function openTag(el: ElementNode, source: string): string {
    if (el.newOpenTag !== undefined) {
        return el.newOpenTag;
    }
    if (!el.synthetic) {
        return source.slice(el.openTagRange.start, el.openTagRange.end);
    }
    const attrs = el.attrs.map((a) => ` ${serializeAttr(a)}`).join('');
    return el.selfClosing ? `<${el.name}${attrs}/>` : `<${el.name}${attrs}>`;
}

export function serializeAttr(attr: Attr): string {
    return `${attr.name}=${attr.quote}${attr.value}${attr.quote}`;
}

export function serialize(doc: Document): string {
    return doc.children.map((node) => serializeNode(node, doc.source)).join('');
}
