/**
 * Renderer inputs supplied by the extension host: reference resolutions (spec §7) and
 * DITAVAL decisions (§11.3). Environment-neutral.
 */

import type { ElementIndex } from '../cst/elementIndex';
import type { CstNode, Document, ElementNode } from '../cst/types';
import type { EntityLookup } from './html';
import type { Labels } from './labels';

/** How a reference was resolved. Keyed by the referencing element in a resolution map. */
export interface Resolution {
    kind: 'key' | 'conref' | 'href' | 'glossary' | 'foreign' | 'code';
    /** Text derived for an element with no content of its own (keyref, empty xref, glossary term). */
    text?: string;
    /** Resolved absolute file path: an image, or the target of a link (for Ctrl+click). */
    path?: string;
    /** Fragment inside `path` (topic/element id), when relevant. */
    fragment?: string;
    /** Key name that drove the resolution. */
    key?: string;
    /** "file#id" description of reused content, for the tooltip. */
    from?: string;
    /**
     * Reused content: the target element. The renderer renders it in place of the
     * referencing element (attributes merged, referencing ones winning), so tables, figures,
     * images… keep their structure and attributes.
     */
    conrefTarget?: ElementNode;
    /** … or just replacement children (when no target element is known). */
    conrefChildren?: CstNode[];
    /** … or a conref/conrefend range of whole elements. */
    conrefRange?: ElementNode[];
    /** The document reused content comes from (for CDATA and entity slices). */
    sourceDoc?: Document;
    /** Absolute path of `sourceDoc`, so relative image references inside it resolve. */
    sourcePath?: string;
    /** MathML/SVG root loaded by mathmlref/svgref. */
    foreignRoot?: ElementNode;
    /** Set when resolution failed; the element renders its own content or a placeholder. */
    unresolved?: string;
}

export interface FlagStyle {
    color?: string;
    backcolor?: string;
    /** underline | double-underline | italics | overline | bold | line-through (space-separated). */
    style?: string;
    startText?: string;
    endText?: string;
    /** Webview URIs of flag images. */
    startImage?: string;
    endImage?: string;
}

export interface FilterDecision {
    excluded: boolean;
    flags: FlagStyle[];
}

export interface RenderOptions {
    /** Ids for `data-struct-id`; elements not in the index (reused content) get none. */
    index?: ElementIndex;
    /** Grammar @class defaults, for documents whose elements do not carry @class. */
    classOf?: (elementName: string) => string | undefined;
    /** General entities (grammar + DOCTYPE internal subset). */
    entity?: EntityLookup;
    labels?: Labels;
    /** Show prolog, comments, PIs, index terms, data, draft comments and condition tags. */
    showMarkup?: boolean;
    resolutions?: ReadonlyMap<ElementNode, Resolution>;
    /** DITAVAL evaluation; undefined when no filter is active. */
    filter?: (el: ElementNode) => FilterDecision | undefined;
    /** Dim excluded content instead of removing it. */
    showExcluded?: boolean;
    /**
     * Map an image reference to a URL the page can load. `href` is decoded, as authored
     * (relative to `sourcePath`, or to the previewed document when `sourcePath` is
     * undefined), or an absolute path resolved through a key.
     */
    imageSrc?: (href: string, el: ElementNode, sourcePath?: string) => string | undefined;
}

export interface RenderResult {
    html: string;
    /** Distinct undeclared entity names met in the document. */
    undeclaredEntities: string[];
    /** Distinct element names rendered as unknown boxes. */
    unknownElements: string[];
}
