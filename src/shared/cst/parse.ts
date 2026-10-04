/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/parse.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted to DitaCraft conventions; ParseError carries the
 * error kind and the element name for the preview's "waiting for well-formed XML" banner.
 */

/**
 * Hand-rolled, offset-tracking XML scanner producing a tiling CST.
 *
 * Scope is the lexical subset DITA documents use: XML declaration, DOCTYPE (an
 * internal subset is kept as part of the doctype node), comments, processing
 * instructions, CDATA, elements with attributes, and text with entity references
 * kept verbatim. Every byte consumed lands in exactly one node, so node ranges tile
 * [0, length). Not a validating parser: no DTD, no entity expansion, no namespace
 * processing (prefixed names are kept as written).
 */

import type { Attr, CstNode, Document, ElementNode, Range } from './types';

export class ParseError extends Error {
    constructor(message: string, public readonly offset: number) {
        super(`${message} at offset ${offset}`);
        this.name = 'ParseError';
    }

    /** The message without the trailing "at offset N". */
    get reason(): string {
        return this.message.replace(/ at offset \d+$/, '');
    }
}

const WS = new Set([' ', '\t', '\n', '\r']);

function isWs(ch: string): boolean {
    return WS.has(ch);
}

/** Characters that terminate an element or attribute name. */
function isNameBoundary(ch: string): boolean {
    return isWs(ch) || ch === '>' || ch === '/' || ch === '=';
}

class Scanner {
    i = 0;

    constructor(public src: string) {}

    eof(): boolean {
        return this.i >= this.src.length;
    }

    startsWith(s: string): boolean {
        return this.src.startsWith(s, this.i);
    }

    /** Parse the whole document into a flat list of top-level nodes. */
    parseDocument(): CstNode[] {
        const nodes: CstNode[] = [];
        while (!this.eof()) {
            nodes.push(this.parseNode(null));
        }
        return nodes;
    }

    private parseNode(parent: ElementNode | null): CstNode {
        const { src } = this;
        if (src[this.i] === '<') {
            if (this.startsWith('<?xml') && this.isXmlDeclHere()) {
                return this.parseXmlDecl(parent);
            }
            if (this.startsWith('<!--')) {
                return this.parseComment(parent);
            }
            if (this.startsWith('<![CDATA[')) {
                return this.parseCdata(parent);
            }
            if (this.startsWith('<!')) {
                return this.parseDoctype(parent);
            }
            if (this.startsWith('<?')) {
                return this.parsePi(parent);
            }
            // '</' is only consumed by parseElement's child loop, never here.
            if (src[this.i + 1] === '/') {
                throw new ParseError('unexpected close tag', this.i);
            }
            return this.parseElement(parent);
        }
        return this.parseText(parent);
    }

    private isXmlDeclHere(): boolean {
        // `<?xml` must be followed by whitespace; otherwise it is an ordinary PI.
        const after = this.src[this.i + 5];
        return after !== undefined && isWs(after);
    }

    private parseText(parent: ElementNode | null): CstNode {
        const start = this.i;
        const next = this.src.indexOf('<', this.i);
        const end = next === -1 ? this.src.length : next;
        this.i = end;
        return { type: 'text', raw: this.src.slice(start, end), range: { start, end }, parent };
    }

    private consumeUntil(marker: string, what: string): number {
        const start = this.i;
        const idx = this.src.indexOf(marker, this.i);
        if (idx === -1) {
            throw new ParseError(`unterminated ${what}`, start);
        }
        this.i = idx + marker.length;
        return this.i;
    }

    private parseComment(parent: ElementNode | null): CstNode {
        const start = this.i;
        this.i += '<!--'.length;
        this.consumeUntil('-->', 'comment');
        return { type: 'comment', range: { start, end: this.i }, parent };
    }

    private parseCdata(parent: ElementNode | null): CstNode {
        const start = this.i;
        this.i += '<![CDATA['.length;
        this.consumeUntil(']]>', 'CDATA section');
        return { type: 'cdata', range: { start, end: this.i }, parent };
    }

    private parsePi(parent: ElementNode | null): CstNode {
        const start = this.i;
        this.i += '<?'.length;
        const targetStart = this.i;
        while (!this.eof() && !isWs(this.src[this.i]) && !this.startsWith('?>')) {
            this.i++;
        }
        const target = this.src.slice(targetStart, this.i);
        this.consumeUntil('?>', 'processing instruction');
        return { type: 'pi', target, range: { start, end: this.i }, parent };
    }

    private parseXmlDecl(parent: ElementNode | null): CstNode {
        const start = this.i;
        this.i += '<?xml'.length;
        this.consumeUntil('?>', 'XML declaration');
        return { type: 'xmldecl', range: { start, end: this.i }, parent };
    }

    private parseDoctype(parent: ElementNode | null): CstNode {
        const start = this.i;
        this.i += '<!'.length;
        let quote: string | null = null;
        let bracket = 0;
        while (!this.eof()) {
            const ch = this.src[this.i];
            if (quote) {
                if (ch === quote) {
                    quote = null;
                }
            } else if (ch === '"' || ch === "'") {
                quote = ch;
            } else if (ch === '[') {
                bracket++;
            } else if (ch === ']') {
                if (bracket > 0) {
                    bracket--;
                }
            } else if (ch === '>' && bracket === 0) {
                this.i++;
                return { type: 'doctype', range: { start, end: this.i }, parent };
            }
            this.i++;
        }
        throw new ParseError('unterminated DOCTYPE', start);
    }

    private parseName(): string {
        const start = this.i;
        while (!this.eof() && !isNameBoundary(this.src[this.i])) {
            this.i++;
        }
        if (this.i === start) {
            throw new ParseError('expected name', start);
        }
        return this.src.slice(start, this.i);
    }

    private skipWs(): void {
        while (!this.eof() && isWs(this.src[this.i])) {
            this.i++;
        }
    }

    private parseElement(parent: ElementNode | null): ElementNode {
        const start = this.i;
        this.i++; // consume '<'
        const name = this.parseName();
        const attrs: Attr[] = [];

        for (;;) {
            this.skipWs();
            const ch = this.src[this.i];
            if (ch === undefined) {
                throw new ParseError(`unterminated start tag <${name}>`, start);
            }
            if (ch === '>' || ch === '/') {
                break;
            }
            attrs.push(this.parseAttr());
        }

        let selfClosing = false;
        if (this.src[this.i] === '/') {
            if (this.src[this.i + 1] !== '>') {
                throw new ParseError('expected />', this.i);
            }
            this.i += 2;
            selfClosing = true;
        } else {
            this.i++; // consume '>'
        }
        const openTagRange: Range = { start, end: this.i };

        const node: ElementNode = {
            type: 'element',
            name,
            attrs,
            selfClosing,
            openTagRange,
            closeTagRange: null,
            children: [],
            range: { start, end: this.i },
            parent,
        };

        if (selfClosing) {
            return node;
        }

        for (;;) {
            if (this.eof()) {
                throw new ParseError(`unterminated element <${name}>`, start);
            }
            if (this.src[this.i] === '<' && this.src[this.i + 1] === '/') {
                const closeStart = this.i;
                this.i += 2;
                const closeName = this.parseName();
                this.skipWs();
                if (this.src[this.i] !== '>') {
                    throw new ParseError('expected > in close tag', this.i);
                }
                this.i++;
                if (closeName !== name) {
                    throw new ParseError(`mismatched close tag </${closeName}> for <${name}>`, closeStart);
                }
                node.closeTagRange = { start: closeStart, end: this.i };
                node.range.end = this.i;
                return node;
            }
            node.children.push(this.parseNode(node));
        }
    }

    private parseAttr(): Attr {
        const nameStart = this.i;
        const name = this.parseName();
        this.skipWs();
        if (this.src[this.i] !== '=') {
            throw new ParseError(`expected = after attribute ${name}`, this.i);
        }
        this.i++;
        this.skipWs();
        const quote = this.src[this.i];
        if (quote !== '"' && quote !== "'") {
            throw new ParseError('expected quoted attribute value', this.i);
        }
        this.i++;
        const valueStart = this.i;
        const close = this.src.indexOf(quote, this.i);
        if (close === -1) {
            throw new ParseError(`unterminated attribute value for ${name}`, valueStart);
        }
        const value = this.src.slice(valueStart, close);
        this.i = close + 1;
        return {
            name,
            value,
            quote,
            valueRange: { start: valueStart, end: close },
            range: { start: nameStart, end: this.i },
        };
    }
}

/** Parse a document. Throws {@link ParseError} on malformed XML. */
export function parse(source: string): Document {
    const scanner = new Scanner(source);
    const children = scanner.parseDocument();
    return { source, children };
}
