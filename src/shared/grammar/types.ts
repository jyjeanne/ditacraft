/**
 * Grammar JSON types (spec Appendix B).
 *
 * A grammar is compiled once per DTD shell from the OASIS DTDs (build time) or from a
 * project's own DTDs (runtime, cached). Phase 1 (preview) reads `class`, `placement`
 * and `entities`; `content`, `mixed`, `empty` and `attrs` are for the Phase 2 editor.
 *
 * Environment-neutral: no `vscode`, no file system.
 */

export const GRAMMAR_FORMAT = 1;

/** Bump when compiler output changes shape or meaning (invalidates every cache). */
export const COMPILER_VERSION = 'ditacraft-grammar-compiler/1.1.0';

/** Where an element may appear: in block flow, in inline (phrase) flow, or both. */
export type Placement = 'block' | 'inline' | 'dual';

export interface GrammarAttribute {
    /** DTD attribute type: CDATA, ID, NMTOKEN, NMTOKENS, IDREF, ENTITY, NOTATION, or 'enum'. */
    type: string;
    /** Allowed values for an enumerated type. */
    values?: string[];
    /** Default (or #FIXED) value, unquoted; null when none. */
    default: string | null;
    required: boolean;
    fixed?: boolean;
}

export interface GrammarElement {
    /** Defaulted @class value, e.g. "- topic/p ". Absent for foreign (MathML/SVG) elements. */
    class?: string;
    /** ProseMirror content expression over mangled names (see pmNames.ts). Phase 2. */
    content: string;
    /**
     * Schema placement: the base-class placement, reconciled with where the DTD allows the
     * element (an inline element allowed next to blocks in an element-only model is dual).
     * For rendering semantics use classTokens.basePlacement(class) instead.
     */
    placement: Placement;
    /** Own model allows text/inline AND block content (ProseMirror needs `textrun`). */
    mixed: boolean;
    /** The DTD allows text in the element (#PCDATA, mixed content, ANY). */
    text?: boolean;
    /**
     * Mixed and #PCDATA models: index into Grammar.childSets, the child elements the DTD
     * allows (in any order and number). The content expression (`inline*`, `(block | textrun)*`)
     * does not say which; the editor's menus do. Absent: no such restriction (ANY, or an
     * element-only model whose content expression is exact).
     */
    childSet?: number;
    /** Declared EMPTY. */
    empty: boolean;
    /** No DITA @class default: foreign vocabulary (MathML, SVG, …), passed through as-is. */
    foreign?: boolean;
    /** Index into Grammar.attrSets: the element's attribute declarations, @class excluded. */
    attrSet: number;
}

export interface Grammar {
    format: number;
    /** e.g. "dita-1.3/concept". */
    id: string;
    /** "1.2" | "1.3" | "2.0" | "custom". */
    ditaVersion: string;
    /** Shell path relative to the bundled dtds/ folder, or absolute for a custom grammar. */
    shell: string;
    publicIds: string[];
    /** Probable document roots (unreferenced topic/map elements). */
    roots: string[];
    compiledWith: string;
    /** General entities declared by the grammar, fully expanded. */
    entities: Record<string, string>;
    elements: Record<string, GrammarElement>;
    /**
     * Distinct attribute declarations as [name, declaration] pairs. Most DITA elements
     * declare the same universal attributes, so storing each pair once keeps a 470-element
     * grammar small. @class is not included — it differs per element (GrammarElement.class).
     */
    attributes: [string, GrammarAttribute][];
    /** Distinct attribute sets, as indexes into `attributes`. */
    attrSets: number[][];
    /** Distinct child-element sets of mixed models (GrammarElement.childSet), names sorted. */
    childSets?: string[][];
    groups: { block: string[]; inline: string[]; dual: string[] };
}

/** An element's full attribute declarations, @class included. */
export function elementAttributes(grammar: Grammar, name: string): Record<string, GrammarAttribute> {
    const el = grammar.elements[name];
    if (!el) {
        return {};
    }
    const attrs: Record<string, GrammarAttribute> = {};
    for (const index of grammar.attrSets[el.attrSet] ?? []) {
        const [attrName, decl] = grammar.attributes[index];
        attrs[attrName] = decl;
    }
    if (el.class) {
        attrs.class = { type: 'CDATA', default: el.class, required: false };
    }
    return attrs;
}

export interface GrammarIndexEntry {
    id: string;
    /** File name relative to the grammars folder. */
    file: string;
    ditaVersion: string;
    shell: string;
    publicIds: string[];
    roots: string[];
}

export interface GrammarIndex {
    format: number;
    compiledWith: string;
    /** Hash of compiler + DTD inputs; the build skips recompilation when unchanged. */
    fingerprint: string;
    grammars: GrammarIndexEntry[];
}

// ---------------------------------------------------------------------------
// Raw grammar: the parser-neutral input to the compiler (typesxml adapter output).
// ---------------------------------------------------------------------------

export type Occurs = '' | '?' | '*' | '+';

export type Particle =
    | { kind: 'pcdata' }
    | { kind: 'name'; name: string; occurs: Occurs }
    | { kind: 'seq' | 'choice'; items: Particle[]; occurs: Occurs };

export type ModelType = 'EMPTY' | 'ANY' | 'Mixed' | '#PCDATA' | 'Children';

export interface RawElement {
    name: string;
    modelType: ModelType;
    /** Top-level particle of the model (absent for EMPTY / ANY). */
    model?: Particle;
    attrs: Record<string, GrammarAttribute>;
}

export interface RawGrammar {
    elements: Map<string, RawElement>;
    /** General (non-parameter) entities: name → replacement text, unexpanded. */
    entities: Map<string, string>;
}
