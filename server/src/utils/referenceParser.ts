/**
 * DITA reference parser utility.
 * Shared by definition and references providers.
 */

/** Parsed reference value (file path + optional fragment). */
export interface ParsedReference {
    filePath: string;
    fragment: string;
}

/** Reference found at a cursor position. */
export interface ReferenceAtOffset {
    type: 'href' | 'conref' | 'conkeyref' | 'keyref';
    value: string;
    valueStart: number;
    valueEnd: number;
}

/** Reference occurrence found during scanning. */
export interface ReferenceOccurrence {
    type: 'href' | 'conref' | 'conkeyref' | 'keyref';
    value: string;
    valueStart: number;
    valueEnd: number;
}

const REF_ATTR_NAMES = ['href', 'conref', 'conkeyref', 'keyref'] as const;
type RefAttrName = typeof REF_ATTR_NAMES[number];

/**
 * Parse a DITA reference value like "file.dita#topicid/elementid".
 * Returns the file path and fragment parts.
 */
export function parseReference(value: string): ParsedReference {
    const hashIdx = value.indexOf('#');
    if (hashIdx < 0) {
        return { filePath: value, fragment: '' };
    }
    return {
        filePath: value.slice(0, hashIdx),
        fragment: value.slice(hashIdx + 1),
    };
}

/**
 * Extract the target element ID from a fragment like "topicid/elementid".
 * Returns the last segment (most specific ID).
 */
export function getTargetId(fragment: string): string {
    if (!fragment) return '';
    const slashIdx = fragment.indexOf('/');
    return slashIdx >= 0 ? fragment.slice(slashIdx + 1) : fragment;
}

/**
 * Find the reference attribute at a given offset in the document text.
 * Returns null if the cursor is not inside a reference attribute value.
 */
export function findReferenceAtOffset(text: string, offset: number): ReferenceAtOffset | null {
    // Scan backwards to find opening quote
    let i = offset;
    while (i > 0 && text[i - 1] !== '"' && text[i - 1] !== '\'' && text[i - 1] !== '<' && text[i - 1] !== '>') {
        i--;
    }
    if (i <= 0 || (text[i - 1] !== '"' && text[i - 1] !== '\'')) {
        return null;
    }

    const quoteChar = text[i - 1];
    const valueStart = i;

    // Find closing quote
    let j = offset;
    while (j < text.length && text[j] !== quoteChar && text[j] !== '<' && text[j] !== '>') {
        j++;
    }
    if (j >= text.length || text[j] !== quoteChar) {
        return null;
    }
    const valueEnd = j;

    // Check there's = before the opening quote
    let k = i - 2; // skip the quote
    while (k >= 0 && text[k] === ' ') k--;
    if (k < 0 || text[k] !== '=') return null;

    // Extract attribute name
    k--;
    while (k >= 0 && text[k] === ' ') k--;
    const attrEnd = k + 1;
    while (k >= 0 && /[\w-]/.test(text[k])) k--;
    const attrName = text.slice(k + 1, attrEnd);

    if (!isRefAttr(attrName)) {
        return null;
    }

    const value = text.slice(valueStart, valueEnd);
    return { type: attrName, value, valueStart, valueEnd };
}

/**
 * Find the ID attribute value at a given offset.
 * Returns the ID value if the cursor is on an id="..." attribute value, null otherwise.
 */
export function findIdAtOffset(text: string, offset: number): { id: string; valueStart: number; valueEnd: number } | null {
    // Scan backwards to find opening quote
    let i = offset;
    while (i > 0 && text[i - 1] !== '"' && text[i - 1] !== '\'' && text[i - 1] !== '<' && text[i - 1] !== '>') {
        i--;
    }
    if (i <= 0 || (text[i - 1] !== '"' && text[i - 1] !== '\'')) {
        return null;
    }

    const quoteChar = text[i - 1];
    const valueStart = i;

    // Find closing quote
    let j = offset;
    while (j < text.length && text[j] !== quoteChar && text[j] !== '<' && text[j] !== '>') {
        j++;
    }
    if (j >= text.length || text[j] !== quoteChar) {
        return null;
    }
    const valueEnd = j;

    // Check there's = before the opening quote
    let k = i - 2;
    while (k >= 0 && text[k] === ' ') k--;
    if (k < 0 || text[k] !== '=') return null;

    // Extract attribute name
    k--;
    while (k >= 0 && text[k] === ' ') k--;
    const attrEnd = k + 1;
    while (k >= 0 && /[\w-]/.test(text[k])) k--;
    const attrName = text.slice(k + 1, attrEnd);

    if (attrName !== 'id') {
        return null;
    }

    return { id: text.slice(valueStart, valueEnd), valueStart, valueEnd };
}

/** Key-name token found at a cursor position within a `keys="..."` attribute. */
export interface KeyAtOffset {
    key: string;
    valueStart: number;
    valueEnd: number;
}

/**
 * Find the specific key-name token under the cursor within a `keys="..."`
 * attribute value. A `keydef` may define multiple keys in one attribute
 * (`keys="a b c"`); this resolves to exactly the whitespace-delimited token
 * the cursor is on, with offsets bounding just that token — not the whole
 * attribute value — so a rename only rewrites the one key under the cursor.
 * Tokenization mirrors `KeySpaceService.extractKeyDefinitions()`
 * (`keysValue.split(/\s+/)`), so the two don't drift on how a multi-key
 * `keydef` is split.
 */
export function findKeyAtOffset(text: string, offset: number): KeyAtOffset | null {
    // Scan backwards to find opening quote (mirrors findIdAtOffset)
    let i = offset;
    while (i > 0 && text[i - 1] !== '"' && text[i - 1] !== '\'' && text[i - 1] !== '<' && text[i - 1] !== '>') {
        i--;
    }
    if (i <= 0 || (text[i - 1] !== '"' && text[i - 1] !== '\'')) {
        return null;
    }

    const quoteChar = text[i - 1];
    const valueStart = i;

    // Find closing quote
    let j = offset;
    while (j < text.length && text[j] !== quoteChar && text[j] !== '<' && text[j] !== '>') {
        j++;
    }
    if (j >= text.length || text[j] !== quoteChar) {
        return null;
    }
    const valueEnd = j;

    // Check there's = before the opening quote. Whitespace-tolerant (any
    // \s, not just literal space) so `keys\n="..."`/`keys\t="..."` anchor
    // the same way the whitespace-tolerant `keys\s*=\s*` regex in
    // KeySpaceService.extractKeyDefinitionsFromElements now does — a cursor
    // placed inside such a value used to fail to match here even though
    // that same key is correctly registered in the key space.
    let k = i - 2;
    while (k >= 0 && /\s/.test(text[k])) k--;
    if (k < 0 || text[k] !== '=') return null;

    // Extract attribute name
    k--;
    while (k >= 0 && /\s/.test(text[k])) k--;
    const attrEnd = k + 1;
    while (k >= 0 && /[\w-]/.test(text[k])) k--;
    const attrName = text.slice(k + 1, attrEnd);

    if (attrName !== 'keys') {
        return null;
    }

    // Find which whitespace-delimited token within the attribute value contains
    // the cursor. Token ranges never touch (at least one whitespace char always
    // separates them), so `relOffset <= tokenEnd` can't ambiguously match two
    // tokens — it only ever extends the match to a cursor sitting right after
    // the token's last character, before the following whitespace/quote.
    const fullValue = text.slice(valueStart, valueEnd);
    const clampedOffset = Math.max(valueStart, Math.min(offset, valueEnd));
    const relOffset = clampedOffset - valueStart;

    const tokenPattern = /\S+/g;
    let tokenMatch: RegExpExecArray | null;
    while ((tokenMatch = tokenPattern.exec(fullValue)) !== null) {
        const tokenStart = tokenMatch.index;
        const tokenEnd = tokenStart + tokenMatch[0].length;
        if (relOffset >= tokenStart && relOffset <= tokenEnd) {
            return {
                key: tokenMatch[0],
                valueStart: valueStart + tokenStart,
                valueEnd: valueStart + tokenEnd,
            };
        }
    }

    return null;
}

/**
 * Find all reference attributes in the document that mention a given ID
 * in their fragment portion.
 */
export function findReferencesToId(text: string, targetId: string): ReferenceOccurrence[] {
    const results: ReferenceOccurrence[] = [];
    // Match href="...", conref="...", conkeyref="...", keyref="..." attribute values
    const pattern = /\b(href|conref|conkeyref|keyref)\s*=\s*["']([^"']+)["']/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const attrName = match[1] as RefAttrName;
        const value = match[2];

        if (referenceMatchesId(attrName, value, targetId)) {
            // Calculate value start by finding the opening quote position
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const quotePos = fullMatch.indexOf(quoteChar);
            const valueStart = match.index + quotePos + 1;
            const valueEnd = valueStart + value.length;

            results.push({ type: attrName, value, valueStart, valueEnd });
        }
    }

    return results;
}

/**
 * Find every `href`/`conref` occurrence in the document that carries a
 * non-empty *file-path* component — i.e. excludes fragment-only references
 * like `conref="#topicid/elementid"`, which can never point at a different
 * file. Unlike `findReferencesToId`/`findReferencesToKey`, this has no
 * target predicate — callers resolve each occurrence's file path
 * themselves (see `server/src/features/moveTopic.ts`) and filter by
 * whichever target path they're looking for.
 *
 * Deliberately scoped to `href`/`conref` only, not the full
 * `href|conref|conkeyref|keyref` set `findReferencesToId` scans — a bare
 * `keyref`/`conkeyref` value is a *key name* (optionally `keyname/id` for
 * conkeyref), not a file path, so running it through `parseReference`
 * would misparse "myKey" as if it were a relative file path.
 */
export function findFileReferences(text: string): ReferenceOccurrence[] {
    const results: ReferenceOccurrence[] = [];
    const pattern = /\b(href|conref)\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        const attrName = match[1] as 'href' | 'conref';
        const value = match[2];

        if (!parseReference(value).filePath) continue;

        const fullMatch = match[0];
        const quoteChar = fullMatch.includes('"') ? '"' : "'";
        const quotePos = fullMatch.indexOf(quoteChar);
        const valueStart = match.index + quotePos + 1;
        const valueEnd = valueStart + value.length;

        results.push({ type: attrName, value, valueStart, valueEnd });
    }

    return results;
}

/**
 * Find all `keyref`/`conkeyref` reference attributes in the document whose
 * value refers to a given key name. `href`/`conref` never carry a key name
 * and are never returned — the counterpart to `findReferencesToId`, whose
 * `referenceMatchesId` explicitly excludes `keyref` since it exists to serve
 * ID-fragment matching. This exists to serve key-name matching instead, so it
 * excludes `href`/`conref` the other way round rather than extending
 * `findReferencesToId`'s matching rules to cover both.
 */
export function findReferencesToKey(text: string, targetKey: string): ReferenceOccurrence[] {
    const results: ReferenceOccurrence[] = [];
    // Match href="...", conref="...", conkeyref="...", keyref="..." attribute values
    const pattern = /\b(href|conref|conkeyref|keyref)\s*=\s*["']([^"']+)["']/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const attrName = match[1] as RefAttrName;
        const value = match[2];

        if (referenceMatchesKey(attrName, value, targetKey)) {
            // Calculate value start by finding the opening quote position
            const fullMatch = match[0];
            const quoteChar = fullMatch.includes('"') ? '"' : "'";
            const quotePos = fullMatch.indexOf(quoteChar);
            const valueStart = match.index + quotePos + 1;
            const valueEnd = valueStart + value.length;

            results.push({ type: attrName, value, valueStart, valueEnd });
        }
    }

    return results;
}

/**
 * Count how many `keys="..."` attribute occurrences in `text` define
 * `keyName` as one of their (possibly several, whitespace-delimited) key
 * tokens.
 *
 * Exists to answer "is this key name unambiguous within this document" —
 * when the count is exactly 1, every `keyref`/`conkeyref` candidate
 * `findReferencesToKey` finds in the *same* text is safe to treat as
 * referring to that one definition without a `KeySpaceService` lookup,
 * because there is no other same-named definition it could be confused
 * with. This sidesteps a real gap in the alternative (verifying via
 * `KeySpaceService.resolveKeyEntry`): that service only ever reads map
 * content from disk and caches the result, so it can't see unsaved edits
 * to the very document a rename is being performed in — a same-file
 * `keyref` could be wrongly judged "not the same definition" purely
 * because the disk-cached `sourceLine` hasn't caught up with the live
 * buffer yet, silently leaving that reference unrenamed.
 */
export function countKeyDefinitionOccurrences(text: string, keyName: string): number {
    let count = 0;
    const pattern = /\bkeys\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
        const tokens = match[1].split(/\s+/).filter(t => t.length > 0);
        if (tokens.includes(keyName)) count++;
    }
    return count;
}

/**
 * Find element by ID in text. Returns offset of the opening < of the element, or -1.
 * Strips comments and CDATA to avoid false matches.
 */
export function findElementByIdOffset(text: string, elementId: string): number {
    // Replace comment/CDATA content with spaces (preserve offsets)
    const cleaned = text
        .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
        .replace(/<!\[CDATA\[[\s\S]*?]]>/g, (m) => ' '.repeat(m.length));

    const escaped = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`<([\\w-]+)[^>]*\\bid\\s*=\\s*["']${escaped}["']`, 'g');
    const match = pattern.exec(cleaned);
    return match ? match.index : -1;
}

function isRefAttr(name: string): name is RefAttrName {
    return (REF_ATTR_NAMES as readonly string[]).includes(name);
}

/**
 * Check if a reference attribute value references a given target ID.
 */
function referenceMatchesId(attrType: RefAttrName, value: string, targetId: string): boolean {
    if (attrType === 'keyref') {
        // keyref values are key names, not file#id patterns
        return false;
    }

    if (attrType === 'conkeyref') {
        // conkeyref format: "keyname/elementid"
        const slashIdx = value.indexOf('/');
        if (slashIdx >= 0) {
            return value.slice(slashIdx + 1) === targetId;
        }
        return false;
    }

    // href and conref: check fragment part
    const { fragment } = parseReference(value);
    if (!fragment) return false;

    const id = getTargetId(fragment);
    return id === targetId;
}

/**
 * Extract the key-name portion of a `keyref`/`conkeyref` value.
 * `keyref` values are just the key name; `conkeyref` values are
 * "keyname/elementid" — this returns the part before the slash.
 */
export function extractKeyPart(value: string): string {
    const slashIdx = value.indexOf('/');
    return slashIdx >= 0 ? value.slice(0, slashIdx) : value;
}

/**
 * Check if a reference attribute value references a given target key name.
 * The counterpart to `referenceMatchesId`: `href`/`conref` never carry a key
 * name and are excluded, where `referenceMatchesId` excludes `keyref` instead.
 */
function referenceMatchesKey(attrType: RefAttrName, value: string, targetKey: string): boolean {
    if (attrType === 'href' || attrType === 'conref') {
        return false;
    }
    // keyref: the whole value is the key name. conkeyref: the part before '/'.
    return extractKeyPart(value) === targetKey;
}
