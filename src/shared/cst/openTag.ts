/**
 * Attribute edits on a start tag, made in place (spec §13.4, §12.4).
 *
 * A changed value is replaced inside its own quotes, a removed attribute goes with the
 * whitespace before it, a new attribute is appended before `>`/`/>`. Everything else in the
 * tag — the other attributes as written (entities, quotes), line breaks and indentation
 * between attributes — is kept, so an attribute change is a minimal edit even in a tag laid
 * out over several lines. The source order of attributes is kept.
 *
 * Environment-neutral.
 */

import { escapeAttr } from './serialize';
import type { ElementNode } from './types';

/** Attribute name/value pairs, values decoded. */
export type AttributePairs = [string, string][];

/**
 * The start tag of `el` with its attributes changed from `oldXml` to `newXml` (both decoded
 * the same way; `oldXml` describes `el.attrs`). With `newName`, the element is renamed.
 */
export function rewriteOpenTag(source: string, el: ElementNode, oldXml: AttributePairs, newXml: AttributePairs, newName?: string): string {
    const start = el.openTagRange.start;
    let tag = source.slice(start, el.openTagRange.end);
    const before = new Map(oldXml);
    const after = new Map(newXml);
    const edits: { from: number; to: number; text: string }[] = [];
    for (const a of el.attrs) {
        if (!after.has(a.name)) {
            let from = a.range.start - start;
            while (from > 0 && /\s/.test(tag[from - 1])) {
                from--;
            }
            edits.push({ from, to: a.range.end - start, text: '' });
        } else if (after.get(a.name) !== before.get(a.name)) {
            edits.push({ from: a.valueRange.start - start, to: a.valueRange.end - start, text: escapeAttr(after.get(a.name)!, a.quote) });
        }
    }
    const existing = new Set(el.attrs.map((a) => a.name));
    const added = newXml.filter(([name]) => !existing.has(name)).map(([name, value]) => ` ${name}="${escapeAttr(value, '"')}"`).join('');
    if (added) {
        let at = tag.endsWith('/>') ? tag.length - 2 : tag.length - 1;
        while (at > 0 && /\s/.test(tag[at - 1])) {
            at--;
        }
        edits.push({ from: at, to: at, text: added });
    }
    edits.sort((x, y) => y.from - x.from || y.to - x.to);
    for (const e of edits) {
        tag = tag.slice(0, e.from) + e.text + tag.slice(e.to);
    }
    if (newName && newName !== el.name) {
        tag = `<${newName}${tag.slice(1 + el.name.length)}`;
    }
    return tag;
}

/** `pairs` with `name` set to `value` (in place, or appended), or removed when `value` is null. */
export function withAttribute(pairs: AttributePairs, name: string, value: string | null): AttributePairs {
    if (value === null) {
        return pairs.filter(([n]) => n !== name);
    }
    return pairs.some(([n]) => n === name) ? pairs.map(([n, v]) => [n, n === name ? value : v]) : [...pairs, [name, value]];
}
