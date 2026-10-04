/** HTML escaping and entity decoding for the preview renderer (spec §5.3). Environment-neutral. */

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** CSS length for a DITA image/@width or @height: bare numbers are pixels. */
export function cssLength(value: string | undefined): string | undefined {
    const v = (value ?? '').trim();
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:cm|em|in|mm|pc|pt|px)?$/.test(v) || parseFloat(v) <= 0) {
        return undefined;
    }
    return /[a-z]$/i.test(v) ? v : `${v}px`;
}

export function escapeAttr(text: string): string {
    return escapeHtml(text).replace(/"/g, '&quot;');
}

/** Looks up a general entity's replacement text (grammar or internal subset). */
export type EntityLookup = (name: string) => string | undefined;

const PREDEFINED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const REF = /&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z_:][\w.:-]*);/g;

function codePoint(cp: number): string | undefined {
    if (!Number.isFinite(cp) || cp <= 0 || cp > 0x10ffff) {
        return undefined;
    }
    try {
        return String.fromCodePoint(cp);
    } catch {
        return undefined;
    }
}

/**
 * Decode raw XML text (entity references intact) to plain text.
 *
 * Predefined and numeric references are decoded; a named reference is expanded through
 * `lookup`; anything else is kept literally (`&name;`) and reported to `onUndeclared` —
 * it is never handed to the browser as markup.
 */
export function decodeXmlText(raw: string, lookup?: EntityLookup, onUndeclared?: (name: string) => void): string {
    if (!raw.includes('&')) {
        return raw;
    }
    return raw.replace(REF, (whole, ref: string) => {
        if (ref.startsWith('#x')) {
            return codePoint(parseInt(ref.slice(2), 16)) ?? whole;
        }
        if (ref.startsWith('#')) {
            return codePoint(parseInt(ref.slice(1), 10)) ?? whole;
        }
        const predefined = PREDEFINED[ref];
        if (predefined !== undefined) {
            return predefined;
        }
        const value = lookup?.(ref);
        if (value !== undefined) {
            return value;
        }
        onUndeclared?.(ref);
        return whole;
    });
}

/** Longest expansion kept for one internal-subset entity (anything larger is dropped). */
export const MAX_ENTITY_CHARS = 10_000;
/** Budget for all internal-subset expansions of one document together. */
const MAX_SUBSET_EXPANSION_CHARS = 200_000;

/**
 * General entities declared in a DOCTYPE internal subset: `<!ENTITY name "value">`.
 *
 * Values may reference each other and are expanded a few levels, with every expansion
 * bounded: an entity whose replacement would exceed MAX_ENTITY_CHARS (a "billion laughs"
 * chain) is dropped, so references to it render literally as undeclared.
 */
export function internalSubsetEntities(subset: string | undefined): Map<string, string> {
    const out = new Map<string, string>();
    if (!subset) {
        return out;
    }
    const decl = /<!ENTITY\s+([A-Za-z_:][\w.:-]*)\s+(?:"([^"]*)"|'([^']*)')\s*>/g;
    let m: RegExpExecArray | null;
    while ((m = decl.exec(subset)) !== null) {
        const value = m[2] ?? m[3];
        if (value.length <= MAX_ENTITY_CHARS) {
            out.set(m[1], value);
        }
    }
    let budget = MAX_SUBSET_EXPANSION_CHARS;
    for (let pass = 0; pass < 5; pass++) {
        for (const [name, value] of [...out]) {
            if (!value.includes('&')) {
                continue;
            }
            // Stop substituting as soon as the expansion would exceed the cap, so no large
            // intermediate string is ever built.
            let produced = value.length;
            const expanded = decodeXmlText(value, (n) => {
                const v = n === name ? undefined : out.get(n);
                if (v === undefined) {
                    return undefined;
                }
                produced += v.length;
                return produced > MAX_ENTITY_CHARS ? '' : v;
            });
            budget -= expanded.length;
            if (produced > MAX_ENTITY_CHARS || budget < 0) {
                out.delete(name);
            } else {
                out.set(name, expanded);
            }
        }
    }
    return out;
}
