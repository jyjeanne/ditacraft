/**
 * Grammar JSON → ProseMirror schema for the visual editor (spec §13.2).
 *
 * Every DITA element of the grammar gets a small family of node types, all members of one
 * group `g_<name>` that the content expressions reference instead of the bare name:
 *
 * | Variant      | When it is used                                                        |
 * |--------------|------------------------------------------------------------------------|
 * | `N`          | the element as the DTD models it (container, textblock, inline, atom)  |
 * | `N__text`    | a block-mixed element (`p`, `li`, `note`, `entry`…) holding only text   |
 * |              | and phrases: a plain textblock, so Enter/Backspace/marks behave natively |
 * | `N__loose`   | a structured element whose instance does not follow the DTD (a topic   |
 * |              | without its title while it is being written): accepts any blocks       |
 * | `N__opaque`  | an instance the editor cannot represent faithfully (reused content,    |
 * |              | blocks inside a phrase, a keyref'd empty phrase): kept verbatim, atom  |
 *
 * Dual-placement elements (§13.2.4) have the same family twice: inline (`image`) and block
 * (`image__block`). Elements whose editing is not offered yet (prolog, index terms, images,
 * footnotes, related links, foreign content…) are atoms whose source is kept verbatim.
 *
 * The highlight domain and `codeph` are marks when an instance carries no attributes
 * (§13.2.2); with attributes they are inline nodes. Text keeps its source mapping through
 * the CST origin tables built by toProseMirror.ts, never through the DOM.
 *
 * Environment-neutral (prosemirror-model only; DOM output specs are plain arrays).
 */

import { Schema, type DOMOutputSpec, type MarkSpec, type MarkType, type Node as PMNode, type NodeSpec, type NodeType } from 'prosemirror-model';
import { basePlacement, classTokens } from '../grammar/classTokens';
import { pmBlockName, pmName, TEXTRUN } from '../grammar/pmNames';
import type { Grammar, GrammarElement, Placement } from '../grammar/types';
import { cssLength } from '../render/html';
import { cssColumnWidths } from './columnWidths';
import { labelsFor, type Labels } from '../render/labels';
import { isMapRowElement, MAP_METADATA_TOKEN, mapRowDom } from './maps';

/** How an element's content is edited. */
export type ElementKind = 'container' | 'mixed' | 'textblock' | 'inline' | 'opaque';

export type Variant = 'main' | 'text' | 'loose' | 'opaque';

/** What a node type stands for (NodeSpec.dita). */
export interface TypeRole {
    /** DITA element name; null for synthetic types (textrun, comments, entities, unknown). */
    element: string | null;
    variant: Variant;
    context: 'block' | 'inline';
    kind: ElementKind;
}

/** Facts about one grammar element. */
export interface ElementFacts {
    name: string;
    cls?: string;
    tokens: string[];
    placement: Placement;
    /** Kind of the element in block context (its block variant) and in inline context. */
    blockKind: ElementKind;
    inlineKind: ElementKind;
    /** Whitespace is significant (pre, codeblock, lines, screen, msgblock…). */
    preserve: boolean;
    /** Mark type name when the element can be a mark. */
    mark?: string;
}

/**
 * Synthetic node types. The `xml_` prefix cannot collide with a mangled DITA name (DITA
 * has its own <unknown> element, whose block variant is `unknown__block`).
 */
export const SYNTHETIC = {
    textrun: TEXTRUN,
    entity: 'xml_entity',
    comment: 'xml_comment',
    pi: 'xml_pi',
    unknownBlock: 'xml_unknown_block',
    unknownInline: 'xml_unknown_inline',
} as const;

/** Mark for text that came from a CDATA section (kept as CDATA). */
export const CDATA_MARK = 'xml_cdata';

/**
 * Base tokens of elements the editor keeps verbatim (atoms) in this release: metadata,
 * index entries, links lists, embedded media and foreign content, footnotes and comments.
 */
const OPAQUE_TOKENS = new Set([
    'topic/prolog', 'topic/titlealts', 'topic/related-links', 'topic/linkpool', 'topic/linklist', 'topic/link',
    'topic/linktext', 'topic/linkinfo', 'topic/data', 'topic/data-about', 'topic/indexterm', 'topic/index-base',
    'topic/indextermref', 'topic/sort-as', 'topic/foreign', 'topic/unknown', 'topic/object', 'topic/param',
    'topic/image', 'topic/alt', 'topic/longdescref', 'topic/longquoteref', 'topic/fn', 'topic/draft-comment',
    'topic/required-cleanup', 'topic/state', 'topic/boolean', 'topic/colspec', 'topic/spanspec',
    'topic/no-topic-nesting', 'topic/include', 'topic/audio', 'topic/video',
    'pr-d/coderef', 'mathml-d/mathmlref', 'svg-d/svgref', 'ut-d/imagemap',
]);

/** Elements that are marks (when attribute-free), by their specific token. */
const MARK_TOKENS = new Set([
    'hi-d/b', 'hi-d/i', 'hi-d/u', 'hi-d/tt', 'hi-d/sup', 'hi-d/sub', 'hi-d/line-through', 'hi-d/overline', 'pr-d/codeph',
]);

const PRESERVE_TOKENS = new Set(['topic/pre', 'topic/lines']);

const ELEMENT_ATTRS = {
    /** Id of the source element (ElementIndex id of the parse the document was built from). */
    src: { default: null },
    /** Instance attributes, decoded, in source order: [name, value][]. */
    xml: { default: [] },
    /** Presentation hints computed at load (text of atoms, table spans…); never serialized. */
    view: { default: null },
    /** Source of an element kept verbatim that was pasted (no source element): written as is. */
    raw: { default: null },
};

export interface EditorSchema {
    schema: Schema;
    grammar: Grammar;
    labels: Labels;
    /** Facts of a grammar element, by DITA name. */
    facts(element: string): ElementFacts | undefined;
    /** The node type for an element in a context and variant (undefined when it does not exist). */
    nodeType(element: string, context: 'block' | 'inline', variant?: Variant): NodeType | undefined;
    /** The mark type of an element, if it is markable. */
    markType(element: string): MarkType | undefined;
    /** Role of a node type (undefined for doc/text). */
    role(type: NodeType): TypeRole | undefined;
    /** DITA element of a mark type. */
    markElement(type: MarkType): string | undefined;
    /**
     * Whether the DTD allows `child` inside `parent` where the content expression cannot say
     * (mixed and text models: `<title>` takes `<ph>` but not `<xref>`, `<note>` takes `<p>` but
     * not `<section>`). True for element-only models: their content expression is exact.
     */
    allows(parent: string, child: string): boolean;
    /** Whether the DTD allows text in `element`. */
    allowsText(element: string): boolean;
}

function kindOf(el: GrammarElement, tokens: string[], context: 'block' | 'inline'): ElementKind {
    if (tokens.some((t) => OPAQUE_TOKENS.has(t)) || el.empty || el.content === '') {
        return 'opaque';
    }
    if (context === 'inline') {
        return 'inline';
    }
    if (el.mixed || el.content === '(block | textrun)*') {
        // A phrase in block context (cmd in step, ph in figgroup) stays a line of text.
        return basePlacement(el.class) === 'block' ? 'mixed' : 'textblock';
    }
    if (el.content === 'inline*') {
        return 'textblock';
    }
    return 'container';
}

/** Replace every element-name token of a content expression by its variant group. */
function groupExpression(content: string, baseNames: Set<string>): string {
    return content.replace(/[A-Za-z0-9_]+/g, (token) => (baseNames.has(token) ? `g_${token}` : token));
}

export function buildEditorSchema(grammar: Grammar, options: { labels?: Labels } = {}): EditorSchema {
    const labels = options.labels ?? labelsFor('en');
    const nodes: Record<string, NodeSpec> = {
        doc: { content: 'block' },
        text: { group: 'inline' },
    };
    const marks: Record<string, MarkSpec> = {};
    const facts = new Map<string, ElementFacts>();
    const markOf = new Map<string, string>();

    // Base names (block and inline) of every element, for content-expression grouping.
    const baseNames = new Set<string>();
    for (const [name, el] of Object.entries(grammar.elements)) {
        if (el.foreign) {
            continue;
        }
        if (el.placement !== 'inline') {
            baseNames.add(el.placement === 'dual' ? pmBlockName(name) : pmName(name));
        }
        if (el.placement !== 'block') {
            baseNames.add(pmName(name));
        }
    }

    for (const [name, el] of Object.entries(grammar.elements)) {
        if (el.foreign) {
            continue;
        }
        const tokens = classTokens(el.class);
        const preserve = tokens.some((t) => PRESERVE_TOKENS.has(t));
        const specific = tokens[tokens.length - 1];
        const fact: ElementFacts = {
            name, cls: el.class, tokens, placement: el.placement, preserve,
            blockKind: kindOf(el, tokens, 'block'),
            inlineKind: kindOf(el, tokens, 'inline'),
        };
        if (specific && MARK_TOKENS.has(specific) && el.placement !== 'block') {
            fact.mark = `m_${pmName(name)}`;
            markOf.set(fact.mark, name);
            marks[fact.mark] = {
                attrs: { src: { default: null } },
                toDOM: () => markDom(fact),
            };
        }
        facts.set(name, fact);

        const family = (base: string, context: 'block' | 'inline', kind: ElementKind): void => {
            const group = `${context} g_${base}`;
            const role = (variant: Variant, k: ElementKind): TypeRole => ({ element: name, variant, context, kind: k });
            const atom = (variant: Variant): NodeSpec => ({
                group, inline: context === 'inline', atom: true, selectable: true, attrs: ELEMENT_ATTRS,
                dita: role(variant, 'opaque'), toDOM: (node: PMNode) => opaqueDom(fact, node, context, editorSchema, labels),
            });
            if (kind === 'opaque') {
                nodes[base] = atom('main');
                return;
            }
            nodes[`${base}__opaque`] = atom('opaque');
            if (context === 'inline') {
                nodes[base] = {
                    group, inline: true, content: 'inline*', attrs: ELEMENT_ATTRS,
                    dita: role('main', 'inline'), toDOM: (node: PMNode) => elementDom(fact, node, 'inline', 'main', editorSchema, labels),
                };
                return;
            }
            const block = (variant: Variant, k: ElementKind, content: string): NodeSpec => ({
                group, content, attrs: ELEMENT_ATTRS, dita: role(variant, k),
                ...(k === 'textblock' && preserve ? { code: true, whitespace: 'pre' } : {}),
                ...(tokens.includes('topic/entry') || tokens.includes('topic/stentry') ? { isolating: true } : {}),
                toDOM: (node: PMNode) => elementDom(fact, node, 'block', variant, editorSchema, labels),
            });
            if (kind === 'textblock') {
                nodes[base] = block('main', 'textblock', 'inline*');
            } else if (kind === 'mixed') {
                nodes[base] = block('main', 'mixed', `(block | ${TEXTRUN})*`);
                nodes[`${base}__text`] = block('text', 'textblock', 'inline*');
            } else {
                const strict = groupExpression(el.content, baseNames);
                nodes[base] = block('main', 'container', strict);
                nodes[`${base}__loose`] = block('loose', 'container', `(block | ${TEXTRUN})*`);
            }
        };

        if (el.placement !== 'inline') {
            family(el.placement === 'dual' ? pmBlockName(name) : pmName(name), 'block', fact.blockKind);
        }
        if (el.placement !== 'block') {
            family(pmName(name), 'inline', fact.inlineKind);
        }
    }

    // Synthetic types.
    nodes[TEXTRUN] = {
        content: 'inline*',
        dita: { element: null, variant: 'main', context: 'block', kind: 'textblock' } satisfies TypeRole,
        toDOM: () => ['div', { class: 'dc-textrun' }, 0],
    };
    const syntheticAtom = (context: 'block' | 'inline', render: (node: PMNode) => DOMOutputSpec, attrs: NodeSpec['attrs']): NodeSpec => ({
        group: context, inline: context === 'inline', atom: true, selectable: true, attrs,
        dita: { element: null, variant: 'opaque', context, kind: 'opaque' } satisfies TypeRole,
        toDOM: render,
    });
    nodes[SYNTHETIC.entity] = syntheticAtom('inline', (node) => ['span', { class: 'dc-entity', title: `&${node.attrs.name};` }, String(node.attrs.text ?? '')], {
        name: { default: '' }, text: { default: '' },
    });
    nodes[SYNTHETIC.comment] = syntheticAtom('inline', (node) => ['span', { class: 'dc-comment dc-markup', title: String(node.attrs.text) }, '💬'], {
        text: { default: '' },
    });
    nodes[SYNTHETIC.pi] = syntheticAtom('inline', (node) => ['span', { class: 'dc-pi dc-markup', title: String(node.attrs.text) }, '⚙'], {
        text: { default: '' },
    });
    const unknownAttrs = { ...ELEMENT_ATTRS, name: { default: '' } };
    nodes[SYNTHETIC.unknownBlock] = syntheticAtom('block', (node) => unknownDom(node, 'block'), unknownAttrs);
    nodes[SYNTHETIC.unknownInline] = syntheticAtom('inline', (node) => unknownDom(node, 'inline'), unknownAttrs);
    // Inclusive: typing at the end of a CDATA section (a code sample) continues it.
    marks[CDATA_MARK] = { inclusive: true, toDOM: () => ['span', { class: 'dc-cdata' }, 0] };

    const schema = new Schema({ topNode: 'doc', nodes, marks });
    const childSetCache = new Map<string, Set<string> | undefined>();

    const editorSchema: EditorSchema = {
        schema,
        grammar,
        labels,
        facts: (element) => facts.get(element),
        nodeType(element, context, variant = 'main') {
            const el = grammar.elements[element];
            if (!el || el.foreign) {
                return undefined;
            }
            if (context === 'block' && el.placement === 'inline') {
                return undefined;
            }
            if (context === 'inline' && el.placement === 'block') {
                return undefined;
            }
            const base = context === 'block' && el.placement === 'dual' ? pmBlockName(element) : pmName(element);
            const name = variant === 'main' ? base : `${base}__${variant}`;
            return schema.nodes[name] ?? (variant === 'opaque' ? schema.nodes[base] : undefined);
        },
        markType: (element) => {
            const mark = facts.get(element)?.mark;
            return mark ? schema.marks[mark] : undefined;
        },
        role: (type) => type.spec.dita as TypeRole | undefined,
        markElement: (type) => markOf.get(type.name),
        allows(parent, child) {
            const set = childSetOf(parent);
            return set === undefined || set.has(child);
        },
        allowsText: (element) => grammar.elements[element]?.text ?? true,
    };
    return editorSchema;

    function childSetOf(element: string): Set<string> | undefined {
        if (!childSetCache.has(element)) {
            const index = grammar.elements[element]?.childSet;
            const names = index !== undefined ? grammar.childSets?.[index] : undefined;
            childSetCache.set(element, names ? new Set(names) : undefined);
        }
        return childSetCache.get(element);
    }
}

// ---------------------------------------------------------------------------------------------
// Presentation (spec §13.2.1: "toDOM reuses the §9 rules so the editor and the preview look
// identical"). Tags and classes follow the DITA-OT HTML5 contract of the preview renderer.

interface Presentation {
    tag: string;
    cls: string;
    inlineTag?: string;
}

const PRESENTATION: Record<string, Presentation> = {
    'topic/topic': { tag: 'article', cls: 'topic' },
    'topic/title': { tag: 'div', cls: 'title' },
    'topic/shortdesc': { tag: 'p', cls: 'shortdesc' },
    'topic/abstract': { tag: 'div', cls: 'abstract' },
    'topic/body': { tag: 'div', cls: 'body' },
    'topic/bodydiv': { tag: 'div', cls: 'bodydiv' },
    'topic/section': { tag: 'section', cls: 'section' },
    'topic/example': { tag: 'div', cls: 'example' },
    'topic/sectiondiv': { tag: 'div', cls: 'sectiondiv' },
    'topic/div': { tag: 'div', cls: 'div' },
    'topic/p': { tag: 'p', cls: 'p' },
    'topic/note': { tag: 'div', cls: 'note' },
    'hazard-d/hazardstatement': { tag: 'div', cls: 'note hazardstatement' },
    'topic/pre': { tag: 'pre', cls: 'pre' },
    'pr-d/codeblock': { tag: 'pre', cls: 'pre codeblock' },
    'sw-d/msgblock': { tag: 'pre', cls: 'pre msgblock' },
    'ui-d/screen': { tag: 'pre', cls: 'pre screen' },
    'topic/lines': { tag: 'div', cls: 'lines' },
    'topic/lq': { tag: 'blockquote', cls: 'lq' },
    'topic/fig': { tag: 'figure', cls: 'fig' },
    'topic/figgroup': { tag: 'div', cls: 'figgroup' },
    'topic/desc': { tag: 'div', cls: 'desc' },
    'topic/ul': { tag: 'ul', cls: 'ul' },
    'topic/ol': { tag: 'ol', cls: 'ol' },
    'topic/li': { tag: 'li', cls: 'li' },
    'topic/sl': { tag: 'ul', cls: 'sl simple' },
    'topic/sli': { tag: 'li', cls: 'sli' },
    'topic/dl': { tag: 'dl', cls: 'dl' },
    'topic/dlentry': { tag: 'div', cls: 'dlentry' },
    'topic/dlhead': { tag: 'div', cls: 'dlhead' },
    'topic/dt': { tag: 'dt', cls: 'dt dlterm' },
    'topic/dthd': { tag: 'dt', cls: 'dthd' },
    'topic/dd': { tag: 'dd', cls: 'dd' },
    'topic/ddhd': { tag: 'dd', cls: 'ddhd' },
    'topic/itemgroup': { tag: 'div', cls: 'itemgroup' },
    'task/steps': { tag: 'ol', cls: 'ol steps' },
    'task/steps-unordered': { tag: 'ul', cls: 'ul steps-unordered' },
    'task/substeps': { tag: 'ol', cls: 'ol substeps' },
    'task/step': { tag: 'li', cls: 'li step stepexpand' },
    'task/substep': { tag: 'li', cls: 'li substep' },
    'task/choices': { tag: 'ul', cls: 'ul choices' },
    'task/choice': { tag: 'li', cls: 'li choice' },
    'task/cmd': { tag: 'div', cls: 'ph cmd', inlineTag: 'span' },
    'topic/table': { tag: 'table', cls: 'table' },
    'topic/tgroup': { tag: 'div', cls: 'tgroup' },
    'topic/thead': { tag: 'thead', cls: 'thead' },
    'topic/tbody': { tag: 'tbody', cls: 'tbody' },
    'topic/row': { tag: 'tr', cls: 'row' },
    'topic/entry': { tag: 'td', cls: 'entry' },
    'topic/simpletable': { tag: 'table', cls: 'simpletable' },
    'topic/sthead': { tag: 'tr', cls: 'sthead' },
    'topic/strow': { tag: 'tr', cls: 'strow' },
    'topic/stentry': { tag: 'td', cls: 'stentry' },
    'topic/ph': { tag: 'div', cls: 'ph', inlineTag: 'span' },
    'topic/keyword': { tag: 'div', cls: 'keyword', inlineTag: 'span' },
    'topic/term': { tag: 'div', cls: 'term', inlineTag: 'dfn' },
    'topic/text': { tag: 'div', cls: 'text', inlineTag: 'span' },
    'topic/tm': { tag: 'div', cls: 'tm', inlineTag: 'span' },
    'topic/cite': { tag: 'div', cls: 'cite', inlineTag: 'cite' },
    'topic/q': { tag: 'div', cls: 'q', inlineTag: 'q' },
    'topic/xref': { tag: 'div', cls: 'xref', inlineTag: 'a' },
    'hi-d/b': { tag: 'div', cls: 'ph b', inlineTag: 'strong' },
    'hi-d/i': { tag: 'div', cls: 'ph i', inlineTag: 'em' },
    'hi-d/u': { tag: 'div', cls: 'ph u', inlineTag: 'u' },
    'hi-d/tt': { tag: 'div', cls: 'ph tt', inlineTag: 'span' },
    'hi-d/sup': { tag: 'div', cls: 'ph sup', inlineTag: 'sup' },
    'hi-d/sub': { tag: 'div', cls: 'ph sub', inlineTag: 'sub' },
    'hi-d/line-through': { tag: 'div', cls: 'ph line-through', inlineTag: 'span' },
    'hi-d/overline': { tag: 'div', cls: 'ph overline', inlineTag: 'span' },
    'pr-d/codeph': { tag: 'div', cls: 'ph codeph', inlineTag: 'code' },
    'pr-d/var': { tag: 'div', cls: 'ph var', inlineTag: 'var' },
    'pr-d/synph': { tag: 'div', cls: 'ph synph', inlineTag: 'span' },
    'pr-d/apiname': { tag: 'div', cls: 'keyword apiname', inlineTag: 'code' },
    'pr-d/option': { tag: 'div', cls: 'keyword option', inlineTag: 'code' },
    'pr-d/parmname': { tag: 'div', cls: 'keyword parmname', inlineTag: 'code' },
    'pr-d/kwd': { tag: 'div', cls: 'keyword kwd', inlineTag: 'code' },
    'pr-d/parml': { tag: 'dl', cls: 'parml' },
    'pr-d/plentry': { tag: 'div', cls: 'plentry' },
    'pr-d/pt': { tag: 'dt', cls: 'pt dlterm' },
    'pr-d/pd': { tag: 'dd', cls: 'pd' },
    'sw-d/filepath': { tag: 'div', cls: 'filepath', inlineTag: 'span' },
    'sw-d/cmdname': { tag: 'div', cls: 'keyword cmdname', inlineTag: 'span' },
    'sw-d/msgnum': { tag: 'div', cls: 'keyword msgnum', inlineTag: 'span' },
    'sw-d/msgph': { tag: 'div', cls: 'ph msgph', inlineTag: 'samp' },
    'sw-d/systemoutput': { tag: 'div', cls: 'ph systemoutput', inlineTag: 'samp' },
    'sw-d/userinput': { tag: 'div', cls: 'ph userinput', inlineTag: 'kbd' },
    'sw-d/varname': { tag: 'div', cls: 'keyword varname', inlineTag: 'var' },
    'ui-d/uicontrol': { tag: 'div', cls: 'keyword uicontrol', inlineTag: 'span' },
    'ui-d/wintitle': { tag: 'div', cls: 'keyword wintitle', inlineTag: 'span' },
    'ui-d/menucascade': { tag: 'div', cls: 'ph menucascade', inlineTag: 'span' },
    'ui-d/shortcut': { tag: 'div', cls: 'keyword shortcut', inlineTag: 'kbd' },
    'markup-d/markupname': { tag: 'div', cls: 'ph markupname', inlineTag: 'code' },
    'xml-d/xmlelement': { tag: 'div', cls: 'ph xmlelement', inlineTag: 'code' },
    'xml-d/xmlatt': { tag: 'div', cls: 'ph xmlatt', inlineTag: 'code' },
    'xml-d/textentity': { tag: 'div', cls: 'ph textentity', inlineTag: 'code' },
    'xml-d/parameterentity': { tag: 'div', cls: 'ph parameterentity', inlineTag: 'code' },
    'xml-d/numcharref': { tag: 'div', cls: 'ph numcharref', inlineTag: 'code' },
    'xml-d/xmlnsname': { tag: 'div', cls: 'ph xmlnsname', inlineTag: 'code' },
    'xml-d/xmlpi': { tag: 'div', cls: 'ph xmlpi', inlineTag: 'code' },
    // Maps (spec §13.8): references are rows (./maps.ts); relationship tables are tables.
    'map/map': { tag: 'div', cls: 'map' },
    'bookmap/bookmap': { tag: 'div', cls: 'map bookmap' },
    'bookmap/mainbooktitle': { tag: 'div', cls: 'ph mainbooktitle', inlineTag: 'span' },
    'bookmap/booktitlealt': { tag: 'div', cls: 'ph booktitlealt', inlineTag: 'span' },
    'map/reltable': { tag: 'table', cls: 'reltable' },
    'map/relheader': { tag: 'tr', cls: 'relheader' },
    'map/relcolspec': { tag: 'th', cls: 'relcolspec' },
    'map/relrow': { tag: 'tr', cls: 'relrow' },
    'map/relcell': { tag: 'td', cls: 'relcell' },
};

const SECTION_LABEL_TOKENS = ['task/prereq', 'task/context', 'task/result', 'task/postreq', 'task/tasktroubleshooting',
    'troubleshooting/condition', 'troubleshooting/cause', 'troubleshooting/remedy'];

function presentationOf(fact: ElementFacts): Presentation | undefined {
    for (let i = fact.tokens.length - 1; i >= 0; i--) {
        const p = PRESENTATION[fact.tokens[i]];
        if (p) {
            return p;
        }
    }
    return undefined;
}

/** Decoded value of an instance attribute stored on a node. */
export function xmlAttr(node: PMNode, name: string): string | undefined {
    const pairs = node.attrs.xml as [string, string][] | undefined;
    return pairs?.find(([n]) => n === name)?.[1];
}

function baseAttrs(fact: ElementFacts, node: PMNode, cls: string): Record<string, string> {
    const outputclass = xmlAttr(node, 'outputclass');
    const out: Record<string, string> = {
        class: `${cls}${outputclass ? ` ${outputclass}` : ''}`,
        'data-dita': fact.name,
    };
    if (fact.cls) {
        out['data-class'] = fact.cls;
    }
    const lang = xmlAttr(node, 'xml:lang');
    if (lang) {
        out.lang = lang;
    }
    return out;
}

function elementDom(fact: ElementFacts, node: PMNode, context: 'block' | 'inline', variant: Variant, es: EditorSchema, labels: Labels): DOMOutputSpec {
    if (context === 'block' && isMapRowElement(fact)) {
        return mapRowDom(fact, node, es, labels);
    }
    const p = presentationOf(fact);
    let tag = context === 'inline' ? (p?.inlineTag ?? 'span') : (p?.tag ?? 'div');
    let cls = p?.cls ?? fact.name;
    if (context === 'block' && variant !== 'text' && tag === 'p') {
        tag = 'div'; // a paragraph holding blocks (lists, notes…)
    }
    // A book title holds its phrases (mainbooktitle…) as its model says, though not as a textblock.
    if (variant === 'loose' && !fact.tokens.includes('bookmap/booktitle')) {
        cls += ' dc-loose';
    }
    if (fact.tokens.includes(MAP_METADATA_TOKEN)) {
        cls += ' dc-markup'; // a reference's metadata: what its row says comes from it
    }
    const attrs = baseAttrs(fact, node, cls);
    if (fact.tokens.includes('topic/note')) {
        const type = xmlAttr(node, 'type') ?? (fact.tokens.includes('hazard-d/hazardstatement') ? 'caution' : 'note');
        const label = type === 'other' ? (xmlAttr(node, 'othertype') ?? labels.note.other)
            : fact.tokens.includes('hazard-d/hazardstatement') ? (labels.hazard[type] ?? type.toUpperCase())
                : (labels.note[type] ?? labels.note.note);
        attrs.class += ` note_${type}`;
        attrs['data-label'] = label;
    } else if (SECTION_LABEL_TOKENS.some((t) => fact.tokens.includes(t))) {
        const key = fact.tokens[fact.tokens.length - 1].split('/')[1];
        attrs['data-label'] = labels.section[key] ?? key;
    } else if (fact.tokens.includes('topic/xref')) {
        const href = xmlAttr(node, 'href') ?? xmlAttr(node, 'keyref');
        if (href) {
            attrs['data-href'] = href;
            attrs.title = href;
        }
    } else if (fact.tokens.includes('topic/pre')) {
        const lang = /(?:^|\s)language-([\w+#.-]+)/.exec(xmlAttr(node, 'outputclass') ?? '')?.[1];
        if (lang) {
            attrs['data-lang'] = lang;
        }
    } else if (fact.tokens.includes('topic/table')) {
        const frame = xmlAttr(node, 'frame');
        if (frame) {
            attrs.class += ` frame-${frame}`;
        }
    } else if (fact.tokens.includes('map/relcell')) {
        attrs['data-placeholder'] = labels.ui.emptyCell ?? 'no references'; // shown while the cell is empty
    } else if (fact.tokens.includes('map/relcolspec')) {
        // A column header: the type of topics the column relates (not editable here: Properties), then its content.
        const type = xmlAttr(node, 'type');
        return [tag, attrs,
            ['div', { class: `dc-colspec-type${type ? '' : ' dc-colspec-any'}`, contenteditable: 'false' }, type || (labels.ui.anyType ?? 'any type')],
            ['div', { class: 'dc-colspec-body' }, 0]];
    } else if (fact.tokens.includes('topic/entry')) {
        const view = node.attrs.view as { colspan?: number; rowspan?: number; head?: boolean } | null;
        if (view?.colspan && view.colspan > 1) {
            attrs.colspan = String(view.colspan);
        }
        if (view?.rowspan && view.rowspan > 1) {
            attrs.rowspan = String(view.rowspan);
        }
    } else if (fact.tokens.includes('task/step') || fact.tokens.includes('task/substep')) {
        const importance = xmlAttr(node, 'importance');
        if (importance === 'optional' || importance === 'required') {
            attrs['data-label'] = importance === 'optional' ? labels.optional : labels.required;
        }
    }
    // Column widths (colspecs of a tgroup, kept in its view; a simple table's @relcolwidth).
    const widths = fact.tokens.includes('topic/tgroup') ? (node.attrs.view as { widths?: string[] } | null)?.widths
        : fact.tokens.includes('topic/simpletable') ? cssColumnWidths((xmlAttr(node, 'relcolwidth') ?? '').trim().split(/\s+/).filter(Boolean)) : undefined;
    if (widths) {
        const colgroup: DOMOutputSpec = ['colgroup', { class: 'dc-colgroup', contenteditable: 'false' },
            ...widths.map((w): DOMOutputSpec => ['col', w ? { style: `width:${w}` } : {}])];
        return [tag, attrs, colgroup, [tag === 'table' ? 'tbody' : 'div', { class: 'dc-table-body' }, 0]];
    }
    return [tag, attrs, 0];
}

function markDom(fact: ElementFacts): DOMOutputSpec {
    const p = presentationOf(fact);
    const attrs: Record<string, string> = { class: p?.cls ?? fact.name, 'data-dita': fact.name };
    return [p?.inlineTag ?? 'span', attrs, 0];
}

/** Summary text of an atom (computed at load into attrs.view.text). */
function viewText(node: PMNode): string {
    const view = node.attrs.view as { text?: string } | null;
    return view?.text ?? '';
}

function opaqueDom(fact: ElementFacts, node: PMNode, context: 'block' | 'inline', es: EditorSchema, labels: Labels): DOMOutputSpec {
    const tag = context === 'inline' ? 'span' : 'div';
    if (context === 'block' && isMapRowElement(fact) && xmlAttr(node, 'conref') === undefined && xmlAttr(node, 'conkeyref') === undefined) {
        return mapRowDom(fact, node, es, labels); // a row with nothing inside (navref, anchor, a book list)
    }
    if (fact.tokens.includes('topic/image')) {
        // As the preview shows it (toHtml.ts imageRule): size, own line, alignment, alt text.
        // The file: as written, or resolved from a key by the host (view.src).
        const resolved = (node.attrs.view as { src?: string } | null)?.src;
        const href = resolved ?? xmlAttr(node, 'href');
        const keyref = xmlAttr(node, 'keyref');
        const alt = (node.attrs.view as { alt?: string } | null)?.alt ?? xmlAttr(node, 'alt') ?? '';
        const styles = [['width', cssLength(xmlAttr(node, 'width'))], ['height', cssLength(xmlAttr(node, 'height'))]]
            .filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';');
        const named = resolved && keyref ? `[${keyref}]` : href;
        const img: DOMOutputSpec = href
            ? ['img', { class: 'image', src: href, alt, 'data-dita': fact.name, title: alt ? `${alt} — ${named}` : named, ...(styles ? { style: styles } : {}) }]
            : ['span', { class: 'image dc-missing-image', 'data-dita': fact.name }, alt || (keyref ? `[${keyref}]` : fact.name)];
        const breakLine = context === 'block' || xmlAttr(node, 'placement') === 'break';
        if (!breakLine) {
            return img;
        }
        const align = xmlAttr(node, 'align');
        const cls = `image-break${align && ['left', 'center', 'right'].includes(align) ? ` image${align}` : ''}`;
        return [context === 'block' ? 'div' : 'span', { class: cls, 'data-dita': fact.name }, img];
    }
    const hidden = ['topic/prolog', 'topic/titlealts', 'topic/data', 'topic/data-about', 'topic/indexterm', 'topic/index-base',
        'topic/sort-as', 'topic/draft-comment', 'topic/required-cleanup'].some((t) => fact.tokens.includes(t));
    const reused = xmlAttr(node, 'conref') !== undefined || xmlAttr(node, 'conkeyref') !== undefined;
    let cls = `dc-opaque${hidden ? ' dc-markup' : ''}${reused ? ' dc-conref' : ''}`;
    if (fact.tokens.includes('topic/fn')) {
        cls += ' fn';
    }
    const text = viewText(node);
    return [tag, { class: cls, 'data-dita': fact.name, ...(fact.cls ? { 'data-class': fact.cls } : {}), title: text || fact.name },
        ['span', { class: 'dc-tag' }, fact.name], ...(text ? [['span', { class: 'dc-opaque-text' }, text] as DOMOutputSpec] : [])];
}

function unknownDom(node: PMNode, context: 'block' | 'inline'): DOMOutputSpec {
    const name = String(node.attrs.name);
    const text = viewText(node);
    return [context === 'inline' ? 'span' : 'div', { class: `dc-unknown${context === 'inline' ? ' dc-unknown-inline' : ''}`, 'data-dita': name, title: text },
        ['span', { class: 'dc-tag' }, name], ...(text ? [['span', { class: 'dc-opaque-text' }, text] as DOMOutputSpec] : [])];
}
