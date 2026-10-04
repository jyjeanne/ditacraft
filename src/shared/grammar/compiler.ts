/**
 * Grammar compiler: RawGrammar (parser-neutral DTD model) → Grammar JSON.
 *
 * Placement (block / inline / dual):
 *   1. Every element with a DITA @class gets the placement of its BASE token
 *      (classTokens.ts) — DITA semantics are defined by class ancestry, so a
 *      specialization is placed like what it specializes.
 *   2. Reconciliation: an inline element that a Children (element-only) model allows
 *      next to block-only elements is promoted to dual, because the schema then needs a
 *      block variant of it in that position.
 *   3. Elements with no @class: prefixed names (MathML `m:…`, SVG `svg:…`) are foreign
 *      vocabulary, kept out of the schema and passed through by the renderer; unprefixed
 *      ones (the `dita` composite root) are blocks.
 *
 * Content expressions (Phase 2 ProseMirror schema, spec Appendix A):
 *   - EMPTY → "" ; ANY → "(block | textrun)*" ; #PCDATA → "inline*"
 *   - Mixed with a block-only member (block-mixed) → "(block | textrun)*", else "inline*"
 *   - Children → structural expression; block variants of dual members when the model
 *     has a block-only member, inline names otherwise; foreign/undeclared names dropped.
 *   - Mixed and #PCDATA models also record which child elements the DTD allows
 *     (`childSet`, deduplicated in `childSets`): the group expressions above do not.
 *
 * Environment-neutral.
 */

import { basePlacement, baseToken } from './classTokens';
import { pmBlockName, pmName } from './pmNames';
import {
    COMPILER_VERSION,
    GRAMMAR_FORMAT,
    type Grammar,
    type GrammarAttribute,
    type GrammarElement,
    type Particle,
    type Placement,
    type RawElement,
    type RawGrammar,
} from './types';

export interface CompileMeta {
    id: string;
    ditaVersion: string;
    shell: string;
    publicIds: string[];
}

const PREDEFINED_ENTITIES = new Set(['amp', 'lt', 'gt', 'quot', 'apos']);
const MAX_ENTITY_DEPTH = 20;
/** Entities expanding past this are dropped (guards against exponential "billion laughs" chains). */
const MAX_ENTITY_CHARS = 10_000;

export function compileGrammar(raw: RawGrammar, meta: CompileMeta): Grammar {
    const entities = expandEntities(raw.entities);
    const names = [...raw.elements.keys()].sort();

    const classOf = new Map<string, string | undefined>();
    const placement = new Map<string, Placement>();
    const foreign = new Set<string>();
    for (const name of names) {
        const el = raw.elements.get(name)!;
        const cls = el.attrs.class?.default ?? undefined;
        classOf.set(name, cls);
        const base = basePlacement(cls);
        if (base) {
            placement.set(name, base);
        } else if (name.includes(':') || (cls === undefined && isForeignByUse(name, raw))) {
            foreign.add(name);
            placement.set(name, 'block');
        } else {
            placement.set(name, 'block');
        }
    }

    const isKnown = (n: string): boolean => raw.elements.has(n) && !foreign.has(n);
    const blockOnly = (n: string): boolean => placement.get(n) === 'block';

    // Reconciliation: inline members of block-structured Children models need a block variant.
    for (const name of names) {
        const el = raw.elements.get(name)!;
        if (foreign.has(name) || el.modelType !== 'Children') {
            continue;
        }
        const ms = [...memberNames(el.model)].filter(isKnown);
        if (ms.some(blockOnly)) {
            for (const m of ms) {
                if (placement.get(m) === 'inline') {
                    placement.set(m, 'dual');
                }
            }
        }
    }

    const referenced = new Set<string>();
    const elements: Record<string, GrammarElement> = {};
    const attributes: [string, GrammarAttribute][] = [];
    const attributeIndex = new Map<string, number>();
    const attrSets: number[][] = [];
    const attrSetIndex = new Map<string, number>();
    const internAttrSet = (attrs: Record<string, GrammarAttribute>): number => {
        const set: number[] = [];
        for (const [attrName, decl] of Object.entries(attrs)) {
            if (attrName === 'class') {
                continue;
            }
            const key = JSON.stringify([attrName, decl]);
            let index = attributeIndex.get(key);
            if (index === undefined) {
                index = attributes.length;
                attributes.push([attrName, decl]);
                attributeIndex.set(key, index);
            }
            set.push(index);
        }
        const setKey = set.join(',');
        let setIndex = attrSetIndex.get(setKey);
        if (setIndex === undefined) {
            setIndex = attrSets.length;
            attrSets.push(set);
            attrSetIndex.set(setKey, setIndex);
        }
        return setIndex;
    };
    const childSets: string[][] = [];
    const childSetIndex = new Map<string, number>();
    const internChildSet = (children: string[]): number => {
        const key = children.join(' ');
        let index = childSetIndex.get(key);
        if (index === undefined) {
            index = childSets.length;
            childSets.push(children);
            childSetIndex.set(key, index);
        }
        return index;
    };
    for (const name of names) {
        const el = raw.elements.get(name)!;
        const ms = [...memberNames(el.model)].filter(isKnown);
        for (const m of ms) {
            if (m !== name) {
                referenced.add(m);
            }
        }
        const isForeign = foreign.has(name);
        const blockMembers = ms.some(blockOnly);
        const mixed = el.modelType === 'ANY' || (el.modelType === 'Mixed' && blockMembers);
        const attrs = expandAttrDefaults(el.attrs, entities);
        const out: GrammarElement = {
            content: isForeign ? '' : contentExpression(el, mixed, blockMembers, isKnown, placement),
            placement: placement.get(name)!,
            mixed,
            empty: el.modelType === 'EMPTY',
            attrSet: internAttrSet(attrs),
        };
        const cls = attrs.class?.default ?? undefined;
        if (cls) {
            out.class = cls;
        }
        if (isForeign) {
            out.foreign = true;
        } else {
            out.text = el.modelType === 'Mixed' || el.modelType === '#PCDATA' || el.modelType === 'ANY';
            if (el.modelType === 'Mixed' || el.modelType === '#PCDATA') {
                out.childSet = internChildSet([...new Set(ms)].sort());
            }
        }
        elements[name] = out;
    }

    const roots = names.filter((n) => {
        if (foreign.has(n) || referenced.has(n)) {
            return false;
        }
        const base = baseToken(classOf.get(n));
        return base === 'topic/topic' || base === 'map/map' || n === 'dita';
    });

    const groups = { block: [] as string[], inline: [] as string[], dual: [] as string[] };
    for (const n of names) {
        if (!foreign.has(n)) {
            groups[placement.get(n)!].push(n);
        }
    }

    return {
        format: GRAMMAR_FORMAT,
        id: meta.id,
        ditaVersion: meta.ditaVersion,
        shell: meta.shell,
        publicIds: [...meta.publicIds].sort(),
        roots,
        compiledWith: COMPILER_VERSION,
        entities,
        elements,
        attributes,
        attrSets,
        childSets,
        groups,
    };
}

/**
 * A classless, unprefixed element is foreign when it only ever appears inside other
 * classless elements (an unprefixed MathML or SVG island). The `dita` root is not
 * referenced at all, so it stays a DITA block.
 */
function isForeignByUse(name: string, raw: RawGrammar): boolean {
    let usedByDita = false;
    let usedAtAll = false;
    for (const el of raw.elements.values()) {
        if (memberNames(el.model).has(name) && el.name !== name) {
            usedAtAll = true;
            if (el.attrs.class?.default) {
                usedByDita = true;
                break;
            }
        }
    }
    return usedAtAll && !usedByDita;
}

/** Every element name referenced by a model. */
export function memberNames(model: Particle | undefined, out = new Set<string>()): Set<string> {
    if (!model) {
        return out;
    }
    if (model.kind === 'name') {
        out.add(model.name);
    } else if (model.kind === 'seq' || model.kind === 'choice') {
        for (const item of model.items) {
            memberNames(item, out);
        }
    }
    return out;
}

function contentExpression(
    el: RawElement,
    mixed: boolean,
    blockMembers: boolean,
    isKnown: (n: string) => boolean,
    placement: Map<string, Placement>,
): string {
    switch (el.modelType) {
        case 'EMPTY':
            return '';
        case 'ANY':
            return '(block | textrun)*';
        case '#PCDATA':
            return 'inline*';
        case 'Mixed':
            return mixed ? '(block | textrun)*' : 'inline*';
        case 'Children': {
            const nameFor = (n: string): string =>
                blockMembers && placement.get(n) === 'dual' ? pmBlockName(n) : pmName(n);
            return renderParticle(el.model, isKnown, nameFor) ?? '';
        }
    }
}

function renderParticle(
    p: Particle | undefined,
    isKnown: (n: string) => boolean,
    nameFor: (n: string) => string,
): string | null {
    if (!p || p.kind === 'pcdata') {
        return null;
    }
    if (p.kind === 'name') {
        return isKnown(p.name) ? nameFor(p.name) + p.occurs : null;
    }
    const items = p.items
        .map((i) => renderParticle(i, isKnown, nameFor))
        .filter((s): s is string => s !== null);
    if (items.length === 0) {
        return null;
    }
    if (items.length === 1 && p.occurs === '') {
        return items[0];
    }
    const joined = p.kind === 'seq' ? items.join(' ') : items.join(' | ');
    return `(${joined})${p.occurs}`;
}

/** Fully expand general entities (character references and nested entity references). */
export function expandEntities(rawEntities: Map<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    const memo = new Map<string, string | null>();
    const expand = (name: string, depth: number): string | null => {
        if (memo.has(name)) {
            return memo.get(name)!;
        }
        if (depth > MAX_ENTITY_DEPTH) {
            return null;
        }
        const value = rawEntities.get(name);
        if (value === undefined) {
            return null;
        }
        memo.set(name, null); // cycle guard
        let produced = value.length;
        let tooLarge = false;
        const result = expandText(value, (ref) => {
            const v = expand(ref, depth + 1);
            if (v !== null) {
                produced += v.length;
                if (produced > MAX_ENTITY_CHARS) {
                    tooLarge = true;
                    return '';
                }
            }
            return v;
        });
        const kept = tooLarge ? null : result;
        memo.set(name, kept);
        return kept;
    };
    for (const name of [...rawEntities.keys()].sort()) {
        if (PREDEFINED_ENTITIES.has(name)) {
            continue;
        }
        const value = expand(name, 0);
        // Entities carrying markup are element content, not text; the preview cannot use them.
        if (value !== null && !value.includes('<')) {
            out[name] = value;
        }
    }
    return out;
}

/** Replace character references and `&name;` references (via `lookup`) in `text`. */
export function expandText(text: string, lookup: (name: string) => string | null): string | null {
    let failed = false;
    const result = text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z_][\w.-]*);/g, (whole, ref: string) => {
        if (ref.startsWith('#x')) {
            return safeFromCodePoint(parseInt(ref.slice(2), 16)) ?? whole;
        }
        if (ref.startsWith('#')) {
            return safeFromCodePoint(parseInt(ref.slice(1), 10)) ?? whole;
        }
        switch (ref) {
            case 'amp': return '&';
            case 'lt': return '<';
            case 'gt': return '>';
            case 'quot': return '"';
            case 'apos': return "'";
        }
        const value = lookup(ref);
        if (value === null) {
            failed = true;
            return whole;
        }
        return value;
    });
    return failed ? null : result;
}

function safeFromCodePoint(cp: number): string | undefined {
    if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) {
        return undefined;
    }
    try {
        return String.fromCodePoint(cp);
    } catch {
        return undefined;
    }
}

function expandAttrDefaults(
    attrs: Record<string, GrammarAttribute>,
    entities: Record<string, string>,
): Record<string, GrammarAttribute> {
    const out: Record<string, GrammarAttribute> = {};
    for (const [name, a] of Object.entries(attrs)) {
        let def = a.default;
        if (def !== null && def.includes('&')) {
            // e.g. @domains defaults to "&included-domains;", a chain of "&…-att;" entities.
            def = expandText(def, (ref) => entities[ref] ?? null) ?? def;
            def = def.replace(/\s+/g, ' ').trim();
        }
        out[name] = { ...a, default: def };
    }
    return out;
}
