/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/types.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted to DitaCraft conventions; no behavioural change.
 */

/**
 * Format-preserving Concrete Syntax Tree (CST) for DITA XML.
 *
 * The on-disk source string is the single source of truth. Every node records an
 * exact [start, end) offset range into that source, and sibling nodes tile their
 * parent's content with no gaps. A *clean* node serializes by slicing the original
 * source (byte-identical); only nodes touched by an edit ("dirty") are rebuilt from
 * their parts. The visual preview renders from this tree; the Phase 2 editor writes
 * back through it.
 *
 * Environment-neutral: no `vscode` import, no file system access.
 */

export interface Range {
    start: number;
    end: number;
}

export interface Attr {
    name: string;
    /** Raw value text between the quotes, entities intact (e.g. `Seat &amp; fleet`). */
    value: string;
    quote: '"' | "'";
    /** Range of the value text (between the quotes), absolute into the source. */
    valueRange: Range;
    /** Range of the whole attribute `name="value"` (no leading whitespace), absolute. */
    range: Range;
}

interface NodeBase {
    range: Range;
    /** Set when this node or a descendant was edited; gates reconstruction vs slice. */
    dirty?: boolean;
    /** Parent link, set during parse; used to propagate dirtiness upward. */
    parent?: ElementNode | null;
    /** Synthetic nodes have no valid source range and are always reconstructed. */
    synthetic?: boolean;
}

export interface TextNode extends NodeBase {
    type: 'text';
    /** Raw source text, entities intact. For synthetic/edited text, see newText. */
    raw: string;
    /** Decoded replacement text supplied by an edit; re-escaped on serialize. */
    newText?: string;
}

export interface CommentNode extends NodeBase {
    type: 'comment';
}

export interface PiNode extends NodeBase {
    type: 'pi';
    target: string;
}

export interface XmlDeclNode extends NodeBase {
    type: 'xmldecl';
}

export interface DocTypeNode extends NodeBase {
    type: 'doctype';
}

export interface CdataNode extends NodeBase {
    type: 'cdata';
}

export interface ElementNode extends NodeBase {
    type: 'element';
    name: string;
    attrs: Attr[];
    selfClosing: boolean;
    /** Range of the open tag `<name ...>` or `<name ... />`, absolute. */
    openTagRange: Range;
    /** Range of the close tag `</name>`, or null when self-closing. */
    closeTagRange: Range | null;
    children: CstNode[];
    /** Reconstructed open tag supplied by an attribute edit. */
    newOpenTag?: string;
}

export type CstNode =
    | TextNode
    | CommentNode
    | PiNode
    | XmlDeclNode
    | DocTypeNode
    | CdataNode
    | ElementNode;

export interface Document {
    source: string;
    children: CstNode[];
}

export function isElement(node: CstNode): node is ElementNode {
    return node.type === 'element';
}
