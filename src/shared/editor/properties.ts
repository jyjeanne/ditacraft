/**
 * The Properties pane's model of an element's attributes (spec §13.4).
 *
 * Fields come from the grammar's declarations (type, enumerated values, default, #REQUIRED,
 * #FIXED) merged with the instance's attributes; attributes the instance carries but the
 * grammar does not declare are listed too. Fields are grouped the way DITA authors think of
 * them: identity and reuse, profiling (conditional processing, including the `props`
 * specializations the document type declares in @domains), common, element-specific, and
 * the architectural attributes (@class, @domains…), shown read-only.
 *
 * Environment-neutral.
 */

import type { AttributePairs } from '../cst/openTag';
import { attr } from '../cst/query';
import type { CstNode, ElementNode } from '../cst/types';
import { isElement } from '../cst/types';
import { classTokens } from '../grammar/classTokens';
import { elementAttributes, type Grammar } from '../grammar/types';

export type PropertyGroup = 'identity' | 'profiling' | 'common' | 'element' | 'architecture';

export interface PropertyField {
    name: string;
    /** Instance value (decoded); undefined when the element does not carry the attribute. */
    value?: string;
    /** DTD type: CDATA, ID, IDREF, NMTOKEN, NMTOKENS, ENTITY, NOTATION, enum. */
    type: string;
    values?: string[];
    defaultValue: string | null;
    required: boolean;
    fixed: boolean;
    /** Declared by the grammar (false: the instance carries an attribute the DTD does not know). */
    declared: boolean;
    group: PropertyGroup;
    readOnly: boolean;
}

export const GROUP_ORDER: PropertyGroup[] = ['identity', 'profiling', 'common', 'element', 'architecture'];

const IDENTITY = ['id', 'conref', 'conrefend', 'conkeyref', 'conaction', 'keyref', 'keys', 'keyscope', 'href', 'scope', 'format'];
const PROFILING_BASE = ['audience', 'platform', 'product', 'otherprops', 'props', 'deliveryTarget'];
const COMMON = ['outputclass', 'xml:lang', 'dir', 'translate', 'rev', 'status', 'importance', 'base'];
const ARCHITECTURE = ['class', 'domains', 'specializations', 'ditaarch:DITAArchVersion', 'xtrf', 'xtrc'];
/** Architectural attributes nobody should type into. */
const READ_ONLY = new Set(['class', 'domains', 'specializations', 'ditaarch:DITAArchVersion']);

/**
 * Profiling attributes of a document type: the base ones plus every `props` specialization
 * declared in @domains, e.g. `a(props deliveryTarget)` or `a(props myPlatform)`.
 */
export function profilingAttributes(grammar: Grammar | undefined): Set<string> {
    const out = new Set(PROFILING_BASE);
    for (const [name, decl] of grammar?.attributes ?? []) {
        if (name === 'domains' && decl.default) {
            for (const m of decl.default.matchAll(/a\(\s*props\s+([^)]+)\)/g)) {
                const names = m[1].trim().split(/\s+/);
                out.add(names[names.length - 1]);
            }
        }
    }
    return out;
}

function groupOf(name: string, profiling: Set<string>): PropertyGroup {
    if (IDENTITY.includes(name)) {
        return 'identity';
    }
    if (profiling.has(name)) {
        return 'profiling';
    }
    if (COMMON.includes(name)) {
        return 'common';
    }
    if (ARCHITECTURE.includes(name) || name.startsWith('xmlns')) {
        return 'architecture';
    }
    return 'element';
}

function rank(name: string, group: PropertyGroup): number {
    const list = group === 'identity' ? IDENTITY : group === 'profiling' ? PROFILING_BASE : group === 'common' ? COMMON : group === 'architecture' ? ARCHITECTURE : [];
    const k = list.indexOf(name);
    return k === -1 ? list.length : k;
}

/** The fields of `element` carrying `xml`, by group and in a stable, readable order. */
export function propertiesOf(grammar: Grammar | undefined, element: string, xml: AttributePairs): PropertyField[] {
    const declared = grammar ? elementAttributes(grammar, element) : {};
    const values = new Map(xml);
    const profiling = profilingAttributes(grammar);
    const fields: PropertyField[] = [];
    for (const [name, decl] of Object.entries(declared)) {
        const group = groupOf(name, profiling);
        fields.push({
            name,
            value: values.get(name),
            type: decl.type,
            values: decl.values?.filter((v) => v !== '-dita-use-conref-target'),
            defaultValue: decl.default,
            required: decl.required,
            fixed: decl.fixed === true,
            declared: true,
            group,
            readOnly: READ_ONLY.has(name) || decl.fixed === true || name.startsWith('xmlns'),
        });
    }
    for (const [name, value] of xml) {
        if (!(name in declared)) {
            const group = groupOf(name, profiling);
            fields.push({
                name, value, type: 'CDATA', defaultValue: null, required: false, fixed: false, declared: false, group,
                readOnly: READ_ONLY.has(name) || name.startsWith('xmlns'),
            });
        }
    }
    // Group, then the group's conventional order, declared before undeclared, then DTD order.
    const order = new Map(fields.map((f, i) => [f, i]));
    return fields.sort((a, b) => (GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
        || (rank(a.name, a.group) - rank(b.name, b.group))
        || (Number(b.declared) - Number(a.declared))
        || (order.get(a)! - order.get(b)!));
}

/**
 * True when giving `target` the id `id` would duplicate another element's id, by DITA's
 * scoping: a topic's id is unique among the document's topics; any other element's id is
 * unique within its own topic (nested topics are separate scopes). Without a `target`
 * (its position is not known), any other element of the document carrying `id` conflicts.
 */
export function idConflict(roots: CstNode[], target: ElementNode | undefined, id: string, classOf: (name: string) => string | undefined): boolean {
    const isTopic = (el: ElementNode): boolean => classTokens(attr(el, 'class') ?? classOf(el.name))[0] === 'topic/topic';
    const found = (nodes: CstNode[], skipTopics: boolean, topicsOnly: boolean): boolean => {
        for (const node of nodes) {
            if (!isElement(node)) {
                continue;
            }
            const topic = isTopic(node);
            if (skipTopics && topic) {
                continue; // a nested topic is its own id scope
            }
            if (node !== target && attr(node, 'id') === id && (!topicsOnly || topic)) {
                return true;
            }
            if (found(node.children, skipTopics, topicsOnly)) {
                return true;
            }
        }
        return false;
    };
    if (!target) {
        return found(roots, false, false);
    }
    if (isTopic(target)) {
        return found(roots, false, true);
    }
    let scope: ElementNode | undefined = target.parent ?? undefined;
    while (scope && !isTopic(scope)) {
        scope = scope.parent ?? undefined;
    }
    return scope ? found(scope.children, true, false) : found(roots, false, false);
}

const NAME_START = /[A-Za-z_:À-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;
// XML 1.0 NameChar includes the combining marks U+0300–U+036F: the range is intended.
// eslint-disable-next-line no-misleading-character-class
const NAME_CHAR = /[-.0-9·̀-ͯ‿-⁀A-Za-z_:À-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;

function isName(token: string): boolean {
    return token.length > 0 && NAME_START.test(token[0]) && [...token].every((c) => NAME_CHAR.test(c));
}

function isNmtoken(token: string): boolean {
    return token.length > 0 && [...token].every((c) => NAME_CHAR.test(c));
}

/**
 * Why `value` cannot be set on `field` (undefined when it can). `idInUse` reports whether
 * another element of the document already has an id.
 */
export function checkValue(field: PropertyField, value: string, idInUse?: (id: string) => boolean): string | undefined {
    if (field.readOnly) {
        return `@${field.name} is not editable`;
    }
    const problem = checkType(field, value);
    if (problem) {
        return problem;
    }
    // DITA declares a topic's @id as ID and other elements' @id as NMTOKEN: both must be unique in their scope.
    if (field.name === 'id' && idInUse?.(value)) {
        return `Another element already has id "${value}"`;
    }
    return undefined;
}

function checkType(field: PropertyField, value: string): string | undefined {
    const trimmed = value.trim();
    switch (field.type) {
        case 'ID':
            return isName(trimmed) && trimmed === value ? undefined : 'An ID starts with a letter or "_" and contains no spaces';
        case 'IDREF':
        case 'ENTITY':
        case 'NOTATION':
            return isName(trimmed) ? undefined : `Not a valid ${field.type} value`;
        case 'NMTOKEN':
            return isNmtoken(trimmed) && trimmed === value ? undefined : 'A single token: letters, digits, ".", "-", "_", ":"';
        case 'NMTOKENS':
        case 'IDREFS':
            return trimmed === '' || trimmed.split(/\s+/).every(isNmtoken) ? undefined : 'Tokens separated by spaces: letters, digits, ".", "-", "_", ":"';
        case 'enum':
            return field.values && !field.values.includes(value) ? `One of: ${field.values.join(', ')}` : undefined;
        default:
            return undefined;
    }
}
