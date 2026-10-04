/**
 * Condition highlighting's marks (§4.5 Piece 2): the source ranges of a DITA file that the active
 * DITAVAL filter excludes, the ones it flags, and how each flag looks in the text editor.
 *
 * Decided by the visual preview's own filter (`buildDitavalFilter` in ditaval.ts), so the text
 * editor and the preview always agree: a value is excluded or flagged by the rule that governs it
 * (its own, its attribute's default, the filter-wide default — which also reaches the `@props`
 * specializations the root element declares), `@rev` values are flagged by `<revprop>`. Content
 * an output drops shows no flag, inner elements included.
 *
 * No `vscode` import: the provider turns `flagLook` into a decoration type.
 */

import { decodeXmlText } from '../shared/render/html';
import type { FlagStyle } from '../shared/render/types';
import { findProfiledElements } from '../utils/xmlElementScanner';
import { declaredPropsSpecializations, type DitavalFilter } from './ditaval';

export interface MarkSpan {
    /** Offset of the element's opening tag. */
    start: number;
    /** Offset just past its closing tag. */
    end: number;
    /** The element's attributes the filter acts on (lower-case names, decoded values). */
    values: Record<string, string>;
}

/** The elements one flag look applies to. */
export interface FlagMarks {
    key: string;
    style: FlagStyle;
    spans: MarkSpan[];
}

export interface ConditionMarks {
    excluded: MarkSpan[];
    flagged: FlagMarks[];
}

export function conditionMarks(text: string, filter: DitavalFilter): ConditionMarks {
    const marks: ConditionMarks = { excluded: [], flagged: [] };
    if (filter.attributes.size === 0) {
        return marks;
    }
    // The @props specializations the document declares count for a filter-wide default, as in the preview.
    const root = rootStartTag(text);
    const specializations = declaredPropsSpecializations(attrValue(root, 'domains'), attrValue(root, 'specializations'));
    const scanned = new Set([...filter.attributes, ...specializations]);
    const byKey = new Map<string, FlagMarks>();
    let excludedEnd = -1;
    // Elements come in document order, so an excluded element's inner ones follow it.
    for (const element of findProfiledElements(text, [...scanned])) {
        if (element.start < excludedEnd) {
            continue;
        }
        const values: Record<string, string> = {};
        for (const [name, value] of Object.entries(element.attrs)) {
            if (scanned.has(name)) {
                values[name] = decodeXmlText(value);
            }
        }
        const decision = filter.decide(values, specializations);
        if (!decision) {
            continue;
        }
        const span: MarkSpan = { start: element.start, end: element.end, values };
        if (decision.excluded) {
            marks.excluded.push(span);
            excludedEnd = element.end;
            continue;
        }
        for (const style of decision.flags) {
            const key = flagKey(style);
            let flag = byKey.get(key);
            if (!flag) {
                flag = { key, style, spans: [] };
                byKey.set(key, flag);
                marks.flagged.push(flag);
            }
            flag.spans.push(span);
        }
    }
    return marks;
}

/** The attribute text of the document's root element (after the prolog, comments and DOCTYPE). */
function rootStartTag(text: string): string | undefined {
    const tags = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE(?:[^[>]|\[[\s\S]*?\])*>|<[A-Za-z_][\w.:-]*((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
    let match: RegExpExecArray | null;
    while ((match = tags.exec(text)) !== null) {
        if (match[1] !== undefined) {
            return match[1];
        }
    }
    return undefined;
}

/** An attribute's decoded value in a start tag's attribute text. */
function attrValue(attrsText: string | undefined, name: string): string | undefined {
    const match = attrsText?.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
    return match ? decodeXmlText(match[1] ?? match[2]) : undefined;
}

/** Flag styles that look the same in the text editor share a key (one decoration type). */
export function flagKey(style: FlagStyle): string {
    const look = flagLook(style);
    return JSON.stringify([look.backgroundColor, look.overviewRulerColor, look.fontWeight, look.fontStyle,
        look.textDecoration, look.before?.contentText, look.after?.contentText]);
}

/** Text shown before or after a flagged element: its start or end flag. */
export interface FlagLabel {
    contentText: string;
    color?: string;
    backgroundColor?: string;
    margin: string;
}

/**
 * A flag's look in the text editor — plain decoration render options. The flag's colours tint the
 * element's background (its back colour, else its colour, lighter) and mark the overview ruler; the
 * text keeps its syntax colours. Its style (bold, italics, underline, double underline, overline,
 * line-through) applies as is; its start and end flags are shown as their alternate text, or ⚑ for
 * an image without one. A flag with no look of its own gets a dotted underline.
 */
export interface FlagLook {
    backgroundColor?: string;
    /** Undefined: the provider's default ruler colour. */
    overviewRulerColor?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    before?: FlagLabel;
    after?: FlagLabel;
}

export function flagLook(style: FlagStyle): FlagLook {
    const color = cssColor(style.color);
    const backcolor = cssColor(style.backcolor);
    const tint = backcolor ? mix(backcolor, 30) : color ? mix(color, 15) : undefined;
    const look: FlagLook = { backgroundColor: tint, overviewRulerColor: color ?? backcolor };

    const styles = (style.style ?? '').toLowerCase().split(/\s+/);
    const lines: string[] = [];
    if (styles.includes('underline') || styles.includes('double-underline')) {
        lines.push('underline');
    }
    if (styles.includes('overline')) {
        lines.push('overline');
    }
    if (styles.includes('line-through')) {
        lines.push('line-through');
    }
    if (styles.includes('bold')) {
        look.fontWeight = 'bold';
    }
    if (styles.includes('italics')) {
        look.fontStyle = 'italic';
    }
    if (lines.length > 0) {
        look.textDecoration = lines.join(' ') + (styles.includes('double-underline') ? ' double' : '');
    }

    const label = (text: string | undefined, image: string | undefined, margin: string): FlagLabel | undefined => {
        const contentText = text || (image ? '⚑' : undefined);
        return contentText ? { contentText, color, backgroundColor: tint, margin } : undefined;
    };
    look.before = label(style.startText, style.startImage, '0 0.3em 0 0');
    look.after = label(style.endText, style.endImage, '0 0 0 0.3em');

    if (!tint && !look.fontWeight && !look.fontStyle && !look.textDecoration && !look.before && !look.after) {
        look.textDecoration = 'underline dotted';
    }
    return look;
}

/** The value of a DITAVAL colour attribute as a CSS colour, when it is one (nothing else reaches CSS). */
function cssColor(value: string | undefined): string | undefined {
    const v = value?.trim();
    return v && /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([\d\s.,%/+-]*(deg)?[\d\s.,%/+-]*\))$/i.test(v) ? v : undefined;
}

function mix(color: string, percent: number): string {
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
