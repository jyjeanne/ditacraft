/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/query.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted; added attr(), rootElement(), doctypePublicId(),
 * findElementById() and textContent().
 */

/** Read-only navigation helpers over the CST. */

import type { CstNode, Document, ElementNode, TextNode } from './types';
import { isElement } from './types';

/** Raw (entity-encoded) value of an attribute, or undefined. */
export function attr(el: ElementNode, name: string): string | undefined {
    return el.attrs.find((a) => a.name === name)?.value;
}

/** Direct child elements of an element. */
export function childElements(el: ElementNode): ElementNode[] {
    return el.children.filter(isElement);
}

/** Direct child elements with a given name. */
export function childrenNamed(el: ElementNode, name: string): ElementNode[] {
    return childElements(el).filter((c) => c.name === name);
}

export function firstChildNamed(el: ElementNode, name: string): ElementNode | undefined {
    return childElements(el).find((c) => c.name === name);
}

/** Depth-first walk over every node. */
export function* walk(nodes: CstNode[]): Generator<CstNode> {
    for (const node of nodes) {
        yield node;
        if (isElement(node)) {
            yield* walk(node.children);
        }
    }
}

/** First element (depth-first) matching name. */
export function findElement(doc: Document, name: string): ElementNode | undefined {
    for (const node of walk(doc.children)) {
        if (isElement(node) && node.name === name) {
            return node;
        }
    }
    return undefined;
}

/** All elements (depth-first) matching name. */
export function findElements(doc: Document, name: string): ElementNode[] {
    const out: ElementNode[] = [];
    for (const node of walk(doc.children)) {
        if (isElement(node) && node.name === name) {
            out.push(node);
        }
    }
    return out;
}

/** The first text-node child of an element, if any. */
export function firstTextChild(el: ElementNode): TextNode | undefined {
    return el.children.find((c): c is TextNode => c.type === 'text');
}

/** The document's root element (the first top-level element). */
export function rootElement(doc: Document): ElementNode | undefined {
    return doc.children.find(isElement);
}

/** PUBLIC identifier of the document's DOCTYPE, if it declares one. */
export function doctypePublicId(doc: Document): string | undefined {
    const node = doc.children.find((c) => c.type === 'doctype');
    if (!node) {
        return undefined;
    }
    const text = doc.source.slice(node.range.start, node.range.end);
    const match = /^<!DOCTYPE\s+[^\s>[]+\s+PUBLIC\s+(["'])([^"']*)\1/i.exec(text);
    return match ? match[2].trim() : undefined;
}

/** Text of the document's DOCTYPE internal subset (between `[` and `]`), if any. */
export function doctypeInternalSubset(doc: Document): string | undefined {
    const node = doc.children.find((c) => c.type === 'doctype');
    if (!node) {
        return undefined;
    }
    const text = doc.source.slice(node.range.start, node.range.end);
    const open = text.indexOf('[');
    const close = text.lastIndexOf(']');
    return open !== -1 && close > open ? text.slice(open + 1, close) : undefined;
}

/** First element (depth-first, document order) whose @id equals `id`, under `nodes`. */
export function findElementById(nodes: CstNode[], id: string): ElementNode | undefined {
    for (const node of walk(nodes)) {
        if (isElement(node) && attr(node, 'id') === id) {
            return node;
        }
    }
    return undefined;
}

/** Concatenated raw text of an element's descendants (entities left encoded). */
export function rawTextContent(el: ElementNode): string {
    let out = '';
    for (const node of walk(el.children)) {
        if (node.type === 'text') {
            out += node.newText ?? node.raw;
        }
    }
    return out;
}
