/**
 * DITAVAL evaluation for the visual preview (spec §11.3): which elements an output would
 * exclude, and how flagged ones are styled.
 *
 * Exclusion reuses DitaCraft's own `isExcludedByRules` (the logic behind condition
 * highlighting), so the preview and the editor agree. With a filter-wide default rule
 * (`<prop action="exclude"/>`), every filtering attribute of an element counts — the
 * conditional processing attributes and the `@props` specializations its document declares
 * (`@domains` `a(props …)`, DITA 2.0 `@specializations` `@props/…`). A value is flagged when
 * the rule that governs it (`governingRule`: its own, its attribute's default, the filter-wide
 * default) is a flag rule — so a filter-wide `<prop action="flag" …/>` flags every filtering
 * value with no rule of its own; `@rev` values by `<revprop>`. Flag styling (color, backcolor,
 * style, start/end flags) is read here, since `parseDitavalRules` keeps only actions.
 *
 * No `vscode` import.
 */

import * as path from 'path';
import { parse } from '../shared/cst/parse';
import { attr, childElements, rawTextContent, walk } from '../shared/cst/query';
import type { ElementNode } from '../shared/cst/types';
import { isElement } from '../shared/cst/types';
import { decodeXmlText } from '../shared/render/html';
import type { FilterDecision, FlagStyle } from '../shared/render/types';
import { FILTERING_ATTRIBUTES, governingRule, isExcludedByRules, isFilteringAttribute, parseDitavalRules, type DitavalRule } from '../utils/ditavalParser';

/** The key of a `<prop>` rule: its attribute (lower case) and value, "" for none. */
function ruleKey(att: string | undefined, val: string | undefined): string {
    return `${att ?? ''}\u0000${val ?? ''}`;
}

export interface DitavalFilter {
    /** Basename of the .ditaval file, for the status line. */
    label: string;
    /**
     * The attributes (lower case) the filter acts on: its rules' attributes, @rev with
     * `<revprop>` flags, the conditional processing attributes with a filter-wide default.
     */
    attributes: ReadonlySet<string>;
    evaluate(el: ElementNode): FilterDecision | undefined;
    /**
     * The decision for an element known only by its decoded attribute values (names in any case)
     * — the text editor's condition highlighting — with the `@props` specializations its document
     * declares (`declaredPropsSpecializations`), as `evaluate` finds them on the root element.
     */
    decide(values: Record<string, string>, specializations?: ReadonlySet<string>): FilterDecision | undefined;
    /** Whether an element with these (decoded) attribute values would be excluded: a topic's metadata from its map. */
    excludes(values: Record<string, string>): boolean;
}

/**
 * Build a filter from a .ditaval file's text. `imageSrc` maps an absolute flag-image path
 * to a webview URL (undefined to drop the image and keep its alt text).
 */
export function buildDitavalFilter(text: string, ditavalPath: string, imageSrc: (absolutePath: string) => string | undefined = () => undefined): DitavalFilter {
    const rules: DitavalRule[] = parseDitavalRules(text);
    /** The styles of the `<prop action="flag">` rules, by rule (the filter-wide one too). */
    const propFlags = new Map<string, FlagStyle>();
    /** The `<revprop action="flag">` rules (`@rev`). */
    const revFlags: { val?: string; style: FlagStyle }[] = [];
    try {
        const doc = parse(text);
        for (const node of walk(doc.children)) {
            if (!isElement(node) || (node.name !== 'prop' && node.name !== 'revprop') || attr(node, 'action')?.toLowerCase() !== 'flag') {
                continue;
            }
            const style = flagStyle(node, ditavalPath, imageSrc);
            if (node.name === 'revprop') {
                revFlags.push({ val: attr(node, 'val'), style });
                continue;
            }
            const key = ruleKey(attr(node, 'att')?.toLowerCase(), attr(node, 'val'));
            if (!propFlags.has(key)) {
                propFlags.set(key, style); // the first rule for a value is the one that applies
            }
        }
    } catch {
        // A malformed .ditaval still filters through the regex-based rule parser.
    }

    const attNames = new Set<string>([
        ...rules.map((r) => r.att).filter((a): a is string => !!a),
        ...(revFlags.length > 0 ? ['rev'] : []),
    ]);
    const filterWide = rules.some((r) => r.att === undefined && r.val === undefined);

    return {
        label: path.basename(ditavalPath),
        attributes: new Set([...attNames, ...(filterWide ? FILTERING_ATTRIBUTES : [])]),
        evaluate(el: ElementNode): FilterDecision | undefined {
            const specializations = filterWide ? propsSpecializations(el) : undefined;
            const filtering = (name: string): boolean => isFilteringAttribute(name) || (specializations?.has(name) ?? false);
            return decideValues(el.attrs.map((a) => [a.name, a.value]), decodeXmlText, filtering);
        },
        decide(values: Record<string, string>, specializations?: ReadonlySet<string>): FilterDecision | undefined {
            const filtering = (name: string): boolean => isFilteringAttribute(name) || (specializations?.has(name) ?? false);
            return decideValues(Object.entries(values), (value) => value, filtering);
        },
        excludes(values: Record<string, string>): boolean {
            return isExcludedByRules(values, rules);
        },
    };

    /**
     * Exclusion and flags for an element's attributes: the ones the filter acts on (its rules'
     * attributes, @rev with `<revprop>` flags, the filtering ones with a filter-wide default).
     */
    function decideValues(attrs: [string, string][], decode: (value: string) => string,
        filtering: (name: string) => boolean): FilterDecision | undefined {
        let values: Record<string, string> | undefined;
        for (const [rawName, value] of attrs) {
            const name = rawName.toLowerCase();
            if (attNames.has(name) || (filterWide && filtering(name))) {
                (values ??= {})[name] = decode(value);
            }
        }
        if (!values) {
            return undefined;
        }
        const excluded = isExcludedByRules(values, rules, filtering);
        // Each value's flag: the governing rule's, when it is a flag rule; @rev's by <revprop>.
        const matched: FlagStyle[] = [];
        const add = (style: FlagStyle | undefined): void => {
            if (style && !matched.includes(style)) {
                matched.push(style);
            }
        };
        for (const [name, value] of Object.entries(values)) {
            for (const token of value.split(/\s+/).filter((t) => t.length > 0)) {
                const rule = governingRule(name, token, rules, filtering);
                if (rule?.action === 'flag') {
                    add(propFlags.get(ruleKey(rule.att, rule.val)));
                }
                if (name === 'rev') {
                    add((revFlags.find((r) => r.val === token) ?? revFlags.find((r) => r.val === undefined))?.style);
                }
            }
        }
        return excluded || matched.length > 0 ? { excluded, flags: matched } : undefined;
    }
}

/** The `@props` specializations an element's document declares (lower case), by its root element. */
const declared = new WeakMap<ElementNode, Set<string>>();

function propsSpecializations(el: ElementNode): Set<string> {
    let root = el;
    while (root.parent) {
        root = root.parent;
    }
    let names = declared.get(root);
    if (!names) {
        const decoded = (name: string): string | undefined => {
            const value = attr(root, name);
            return value === undefined ? undefined : decodeXmlText(value);
        };
        names = declaredPropsSpecializations(decoded('domains'), decoded('specializations'));
        declared.set(root, names);
    }
    return names;
}

/**
 * The `@props` specializations (lower case) a document's root element declares, from its decoded
 * `@domains` and `@specializations`.
 */
export function declaredPropsSpecializations(domains: string | undefined, specializations: string | undefined): Set<string> {
    const names = new Set<string>();
    // DITA 1.x: a(props deliveryTarget), a(props person jobrole) — every name after "props".
    for (const m of (domains ?? '').matchAll(/a\(\s*props\s+([^)]*)\)/g)) {
        m[1].trim().split(/\s+/).forEach((n) => names.add(n.toLowerCase()));
    }
    // DITA 2.0: @props/deliveryTarget, @props/person/jobrole.
    for (const m of (specializations ?? '').matchAll(/@props\/([\w./-]+)/g)) {
        m[1].split('/').forEach((n) => names.add(n.toLowerCase()));
    }
    return names;
}

function flagStyle(prop: ElementNode, ditavalPath: string, imageSrc: (absolutePath: string) => string | undefined): FlagStyle {
    const style: FlagStyle = {
        color: attr(prop, 'color'),
        backcolor: attr(prop, 'backcolor'),
        style: attr(prop, 'style'),
    };
    for (const child of childElements(prop)) {
        if (child.name !== 'startflag' && child.name !== 'endflag') {
            continue;
        }
        const altText = childElements(child).find((c) => c.name === 'alt-text');
        const text = altText ? decodeXmlText(rawTextContent(altText)).trim() : undefined;
        const imageref = attr(child, 'imageref');
        const image = imageref ? imageSrc(path.resolve(path.dirname(ditavalPath), decodeXmlText(imageref))) : undefined;
        if (child.name === 'startflag') {
            style.startText = text;
            style.startImage = image;
        } else {
            style.endText = text;
            style.endImage = image;
        }
    }
    return style;
}
