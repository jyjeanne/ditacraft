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
