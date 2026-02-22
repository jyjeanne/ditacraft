/**
 * Error-tolerant XML tokenizer for providing LSP features on malformed documents.
 *
 * Design:
 * - State machine tokenizer that produces typed tokens with line/column tracking
 * - Tolerates missing quotes, missing '=', mismatched end tags, missing '>'
 * - Produces a token stream usable by completion, hover, and go-to-definition
 *   even when the document is not well-formed XML
 */

export enum TokenType {
    ELEMENT_START = 'ELEMENT_START',          // '<'
    ELEMENT_END = 'ELEMENT_END',              // '>'
    ELEMENT_CLOSE = 'ELEMENT_CLOSE',          // '</'
    EMPTY_ELEMENT_END = 'EMPTY_ELEMENT_END',  // '/>'
    ELEMENT_NAME_START = 'ELEMENT_NAME_START',
    ELEMENT_NAME_END = 'ELEMENT_NAME_END',
    ATTR_NAME = 'ATTR_NAME',
    EQUALS = 'EQUALS',
    ATTR_QUOTE = 'ATTR_QUOTE',
    ATTR_VALUE = 'ATTR_VALUE',
    CHAR_DATA = 'CHAR_DATA',
    COMMENT_START = 'COMMENT_START',
    COMMENT_BODY = 'COMMENT_BODY',
    COMMENT_END = 'COMMENT_END',
    CDATA_START = 'CDATA_START',
    CDATA_CONTENT = 'CDATA_CONTENT',
    CDATA_END = 'CDATA_END',
    PI_START = 'PI_START',
    PI_CONTENT = 'PI_CONTENT',
    PI_END = 'PI_END',
    DOCTYPE_START = 'DOCTYPE_START',
    DOCTYPE_CONTENT = 'DOCTYPE_CONTENT',
    DOCTYPE_END = 'DOCTYPE_END',
    EOF = 'EOF',
}

export interface Token {
    type: TokenType;
    text: string;
    line: number;      // 0-based (LSP convention)
    column: number;    // 0-based (LSP convention)
    offset: number;    // 0-based character offset
}

const enum State {
    CONTENT,
    COMMENT,
    DOCTYPE,
    PI,
    START_ELEM,
    END_ELEM,
    ATTRS,
    ATTR_VALUE,
}

/**
 * Tokenize XML text with error recovery.
 * Returns a generator of tokens.
 */
export function* tokenize(input: string): Generator<Token> {
    let pos = 0;
    let line = 0;
    let column = 0;
    let state: State = State.CONTENT;
    let attrQuoteChar = '"';
    const elementStack: string[] = [];

    function peek(ahead = 0): string {
        return pos + ahead < input.length ? input[pos + ahead] : '';
    }

    function advance(): string {
        const ch = input[pos] || '';
        pos++;
        if (ch === '\n') {
            line++;
            column = 0;
        } else if (ch === '\r') {
            if (pos < input.length && input[pos] === '\n') {
                pos++;
                line++;
                column = 0;
                return '\r\n';
            }
            line++;
            column = 0;
        } else {
            column++;
        }
        return ch;
    }

    function makeToken(
        type: TokenType, text: string,
        startLine: number, startCol: number, startOffset: number
    ): Token {
        return { type, text, line: startLine, column: startCol, offset: startOffset };
    }

    function isNameStartChar(ch: string): boolean {
        if (!ch) return false;
        const c = ch.charCodeAt(0);
        return (c >= 0x41 && c <= 0x5A)  // A-Z
            || (c >= 0x61 && c <= 0x7A)  // a-z
            || c === 0x3A                 // :
            || c === 0x5F                 // _
            || (c >= 0xC0 && c <= 0xD6) || (c >= 0xD8 && c <= 0xF6)
            || (c >= 0xF8 && c <= 0x2FF) || (c >= 0x370 && c <= 0x37D);
    }

    function isNameChar(ch: string): boolean {
        if (!ch) return false;
        return isNameStartChar(ch) || ch === '-' || ch === '.'
            || (ch >= '0' && ch <= '9');
    }

    function isWhitespace(ch: string): boolean {
        return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
    }

    function scanName(): string {
        let name = '';
        while (pos < input.length && isNameChar(input[pos])) {
            name += advance();
        }
        return name;
    }

    while (pos < input.length) {
        const startLine = line;
        const startCol = column;
        const startOffset = pos;
        const ch = input[pos];

        switch (state) {
            case State.CONTENT:
                if (ch === '<') {
                    if (input.substring(pos, pos + 4) === '<!--') {
                        advance(); advance(); advance(); advance();
                        yield makeToken(TokenType.COMMENT_START, '<!--', startLine, startCol, startOffset);
                        state = State.COMMENT;
                    } else if (input.substring(pos, pos + 9) === '<![CDATA[') {
                        for (let i = 0; i < 9; i++) advance();
                        yield makeToken(TokenType.CDATA_START, '<![CDATA[', startLine, startCol, startOffset);
                        const cdataStart = pos;
                        const cdataStartLine = line;
                        const cdataStartCol = column;
                        while (pos < input.length && input.substring(pos, pos + 3) !== ']]>') {
                            advance();
                        }
                        yield makeToken(
                            TokenType.CDATA_CONTENT,
                            input.substring(cdataStart, pos),
                            cdataStartLine, cdataStartCol, cdataStart
                        );
                        if (pos < input.length) {
                            const endStart = pos;
                            const endLine = line;
                            const endCol = column;
                            advance(); advance(); advance();
                            yield makeToken(TokenType.CDATA_END, ']]>', endLine, endCol, endStart);
                        }
                    } else if (input.substring(pos, pos + 9).toUpperCase() === '<!DOCTYPE') {
                        for (let i = 0; i < 9; i++) advance();
                        yield makeToken(
                            TokenType.DOCTYPE_START,
                            input.substring(startOffset, pos),
                            startLine, startCol, startOffset
                        );
                        state = State.DOCTYPE;
                    } else if (input.substring(pos, pos + 2) === '<?') {
                        advance(); advance();
                        yield makeToken(TokenType.PI_START, '<?', startLine, startCol, startOffset);
                        state = State.PI;
                    } else if (input.substring(pos, pos + 2) === '</') {
                        advance(); advance();
                        yield makeToken(TokenType.ELEMENT_CLOSE, '</', startLine, startCol, startOffset);
                        state = State.END_ELEM;
                    } else {
                        advance();
                        yield makeToken(TokenType.ELEMENT_START, '<', startLine, startCol, startOffset);
                        state = State.START_ELEM;
                    }
                } else {
                    // Text content
                    let text = '';
                    while (pos < input.length && input[pos] !== '<') {
                        text += advance();
                    }
                    if (text) {
                        yield makeToken(TokenType.CHAR_DATA, text, startLine, startCol, startOffset);
                    }
                }
                break;

            case State.COMMENT: {
                const { content: body, found } = scanUntil('-->');
                if (body.length > 0) {
                    yield makeToken(TokenType.COMMENT_BODY, body, startLine, startCol, startOffset);
                }
                if (found) {
                    const endLine = line;
                    const endCol = column;
                    const endOffset = pos;
                    advance(); advance(); advance();
                    yield makeToken(TokenType.COMMENT_END, '-->', endLine, endCol, endOffset);
                }
                state = State.CONTENT;
                break;
            }

            case State.DOCTYPE:
                if (ch === '>') {
                    advance();
                    yield makeToken(TokenType.DOCTYPE_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                } else {
                    // Skip DOCTYPE content (including internal subset with [ ... ])
                    let depth = 0;
                    let dtContent = '';
                    while (pos < input.length) {
                        if (input[pos] === '[') depth++;
                        if (input[pos] === ']') depth--;
                        if (input[pos] === '>' && depth <= 0) break;
                        dtContent += advance();
                    }
                    if (dtContent) {
                        yield makeToken(TokenType.DOCTYPE_CONTENT, dtContent, startLine, startCol, startOffset);
                    }
                }
                break;

            case State.PI: {
                const { content: piBody, found: piFound } = scanUntil('?>');
                if (piBody.length > 0) {
                    yield makeToken(TokenType.PI_CONTENT, piBody, startLine, startCol, startOffset);
                }
                if (piFound) {
                    const endLine = line;
                    const endCol = column;
                    const endOffset = pos;
                    advance(); advance();
                    yield makeToken(TokenType.PI_END, '?>', endLine, endCol, endOffset);
                }
                state = State.CONTENT;
                break;
            }

            case State.START_ELEM:
                if (isNameStartChar(ch)) {
                    const name = scanName();
                    yield makeToken(TokenType.ELEMENT_NAME_START, name, startLine, startCol, startOffset);
                    elementStack.push(name);
                    state = State.ATTRS;
                } else if (isWhitespace(ch)) {
                    advance();
                } else {
                    // Error recovery: treat as content
                    state = State.CONTENT;
                }
                break;

            case State.ATTRS:
                if (isWhitespace(ch)) {
                    advance(); // skip whitespace between attributes
                } else if (ch === '>') {
                    advance();
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                } else if (ch === '/' && peek(1) === '>') {
                    advance(); advance();
                    yield makeToken(TokenType.EMPTY_ELEMENT_END, '/>', startLine, startCol, startOffset);
                    elementStack.pop();
                    state = State.CONTENT;
                } else if (ch === '=') {
                    advance();
                    yield makeToken(TokenType.EQUALS, '=', startLine, startCol, startOffset);
                } else if (ch === '"' || ch === '\'') {
                    attrQuoteChar = ch;
                    advance();
                    yield makeToken(TokenType.ATTR_QUOTE, ch, startLine, startCol, startOffset);
                    state = State.ATTR_VALUE;
                } else if (isNameStartChar(ch)) {
                    const name = scanName();
                    yield makeToken(TokenType.ATTR_NAME, name, startLine, startCol, startOffset);
                } else {
                    // Error recovery: emit synthetic '>' and go back to content
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                }
                break;

            case State.ATTR_VALUE:
                if (ch === attrQuoteChar) {
                    advance();
                    yield makeToken(TokenType.ATTR_QUOTE, ch, startLine, startCol, startOffset);
                    state = State.ATTRS;
                } else if (ch === '<') {
                    // Error recovery: unclosed attribute value — new element starts
                    yield makeToken(TokenType.ATTR_QUOTE, attrQuoteChar, startLine, startCol, startOffset);
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                } else if (ch === '>' && (peek(1) === '\n' || peek(1) === '\r' || peek(1) === '<' || peek(1) === '')) {
                    // Error recovery: '>' likely ends the tag, not part of value
                    yield makeToken(TokenType.ATTR_QUOTE, attrQuoteChar, startLine, startCol, startOffset);
                    advance();
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                } else {
                    let value = '';
                    while (pos < input.length
                        && input[pos] !== attrQuoteChar
                        && input[pos] !== '<'
                        && !(input[pos] === '>' && (peek(1) === '\n' || peek(1) === '\r' || peek(1) === '<' || peek(1) === ''))) {
                        value += advance();
                    }
                    if (value) {
                        yield makeToken(TokenType.ATTR_VALUE, value, startLine, startCol, startOffset);
                    }
                }
                break;

            case State.END_ELEM:
                if (isNameStartChar(ch)) {
                    const name = scanName();
                    yield makeToken(TokenType.ELEMENT_NAME_END, name, startLine, startCol, startOffset);
                    // Pop matching element from stack (error-tolerant: pop even if mismatched)
                    if (elementStack.length > 0) {
                        const topIdx = elementStack.lastIndexOf(name);
                        if (topIdx >= 0) {
                            elementStack.splice(topIdx);
                        } else {
                            elementStack.pop();
                        }
                    }
                } else if (ch === '>') {
                    advance();
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                } else if (isWhitespace(ch)) {
                    advance();
                } else {
                    // Error recovery
                    yield makeToken(TokenType.ELEMENT_END, '>', startLine, startCol, startOffset);
                    state = State.CONTENT;
                }
                break;
        }
    }

    yield makeToken(TokenType.EOF, '', line, column, pos);

    // --- Helper closures ---

    /**
     * Scan forward until the delimiter is found.
     * Returns { content, found } — content is always what was consumed before
     * the delimiter (or end of input if not found).
     */
    function scanUntil(delimiter: string): { content: string; found: boolean } {
        let content = '';
        while (pos < input.length) {
            if (input.substring(pos, pos + delimiter.length) === delimiter) {
                return { content, found: true };
            }
            content += advance();
        }
        return { content, found: false };
    }
}

/**
 * Find the attribute at a given offset in the document.
 * Returns the attribute name, value, element name, and value positions,
 * or null if cursor is not in an attribute value.
 */
export function findAttributeAtOffset(
    input: string,
    targetOffset: number
): {
    elementName: string;
    attrName: string;
    attrValue: string;
    valueStart: number;
    valueEnd: number;
} | null {
    let currentElementName = '';
    let currentAttrName = '';

    for (const token of tokenize(input)) {
        // Stop scanning well past the target to avoid unnecessary work
        if (token.offset > targetOffset + 200) break;

        switch (token.type) {
            case TokenType.ELEMENT_NAME_START:
                currentElementName = token.text;
                currentAttrName = '';
                break;
            case TokenType.ATTR_NAME:
                currentAttrName = token.text;
                break;
            case TokenType.ATTR_VALUE: {
                const valueStart = token.offset;
                const valueEnd = token.offset + token.text.length;
                if (targetOffset >= valueStart && targetOffset <= valueEnd) {
                    return {
                        elementName: currentElementName,
                        attrName: currentAttrName,
                        attrValue: token.text,
                        valueStart,
                        valueEnd,
                    };
                }
                break;
            }
            case TokenType.ELEMENT_END:
            case TokenType.EMPTY_ELEMENT_END:
                currentAttrName = '';
                break;
        }
    }
    return null;
}

/**
 * Find which element and context the cursor is in at the given offset.
 * Returns information about the cursor context for completion purposes.
 */
export function findContextAtOffset(
    input: string,
    targetOffset: number
): {
    context: 'element-name' | 'attribute-name' | 'attribute-value' | 'content' | 'comment' | 'cdata' | 'pi';
    elementName: string;
    attrName: string;
    prefix: string;
} {
    let currentElementName = '';
    let currentAttrName = '';
    let lastContext: 'element-name' | 'attribute-name' | 'attribute-value' | 'content' | 'comment' | 'cdata' | 'pi' = 'content';
    let lastPrefix = '';

    for (const token of tokenize(input)) {
        if (token.offset > targetOffset) break;

        const tokenEnd = token.offset + token.text.length;

        switch (token.type) {
            case TokenType.ELEMENT_START:
                lastContext = 'element-name';
                lastPrefix = '';
                break;
            case TokenType.ELEMENT_NAME_START:
                currentElementName = token.text;
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'element-name';
                    lastPrefix = token.text.substring(0, targetOffset - token.offset);
                }
                break;
            case TokenType.ATTR_NAME:
                currentAttrName = token.text;
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'attribute-name';
                    lastPrefix = token.text.substring(0, targetOffset - token.offset);
                }
                break;
            case TokenType.ATTR_VALUE:
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'attribute-value';
                    lastPrefix = token.text.substring(0, targetOffset - token.offset);
                }
                break;
            case TokenType.ATTR_QUOTE:
                // Right after opening quote = start of attribute value
                if (targetOffset === tokenEnd) {
                    lastContext = 'attribute-value';
                    lastPrefix = '';
                }
                break;
            case TokenType.ELEMENT_END:
            case TokenType.EMPTY_ELEMENT_END:
                lastContext = 'content';
                currentAttrName = '';
                break;
            case TokenType.CHAR_DATA:
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'content';
                }
                break;
            case TokenType.COMMENT_START:
            case TokenType.COMMENT_BODY:
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'comment';
                }
                break;
            case TokenType.CDATA_START:
            case TokenType.CDATA_CONTENT:
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'cdata';
                }
                break;
            case TokenType.PI_START:
            case TokenType.PI_CONTENT:
                if (targetOffset >= token.offset && targetOffset <= tokenEnd) {
                    lastContext = 'pi';
                }
                break;
            case TokenType.EQUALS:
                // After '=' and before quote: still in attribute context
                break;
        }

        // When we're between ELEMENT_NAME_START and ELEMENT_END (in attrs area)
        // but not on any specific token, we're in attribute-name context
        if (token.type === TokenType.ELEMENT_NAME_START && targetOffset >= tokenEnd) {
            lastContext = 'attribute-name';
            lastPrefix = '';
        }
    }

    return {
        context: lastContext,
        elementName: currentElementName,
        attrName: currentAttrName,
        prefix: lastPrefix,
    };
}
