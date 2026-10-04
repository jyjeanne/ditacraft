/**
 * MathML and SVG passthrough for the preview (spec §9.6, §8.3).
 *
 * DITA carries MathML (`m:math`) and SVG (`svg:svg`) as foreign vocabulary. Browsers
 * render both natively when they appear unprefixed in HTML, so the subtree is
 * re-serialized with prefixes removed and sanitized by allowlist:
 * - only known presentation-MathML and static-SVG element names are emitted (in their
 *   canonical case); other elements are unwrapped (their text kept, markup dropped), and
 *   elements that carry HTML or styling (style, foreignObject, script, HTML-encoded
 *   annotation-xml…) are dropped with their content;
 * - attribute names must match a strict pattern and are checked by LOCAL name (so
 *   `m:onclick` is caught); event handlers, `style` and every non-fragment reference are
 *   dropped.
 * The page's CSP blocks scripts and remote loads as a second line of defence.
 *
 * Environment-neutral.
 */

import type { CstNode, Document, ElementNode } from '../cst/types';
import { isElement } from '../cst/types';
import { decodeXmlText, escapeAttr, escapeHtml, type EntityLookup } from './html';

const MATHML_ELEMENTS = [
    'math', 'maction', 'maligngroup', 'malignmark', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi',
    'mlabeledtr', 'mlongdiv', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mprescripts', 'mroot',
    'mrow', 'ms', 'mscarries', 'mscarry', 'msgroup', 'msline', 'mspace', 'msqrt', 'msrow', 'mstack', 'mstyle', 'msub',
    'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'none', 'semantics', 'annotation',
];

const SVG_ELEMENTS = [
    'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
    'polygon', 'text', 'tspan', 'textPath', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern',
    'marker', 'image', 'switch', 'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
    'feFlood', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feTile', 'feFuncA', 'feFuncR',
    'feFuncG', 'feFuncB',
];

/** Lower-case local name → canonical (case-sensitive) name. */
const ALLOWED = new Map<string, string>([...MATHML_ELEMENTS, ...SVG_ELEMENTS].map((n) => [n.toLowerCase(), n]));

/** Dropped together with everything inside them. */
const DROP_SUBTREE = new Set(['script', 'style', 'foreignobject', 'iframe', 'object', 'embed', 'handler', 'listener',
    'animate', 'animatemotion', 'animatetransform', 'set', 'a', 'annotation-xml', 'audio', 'video', 'canvas']);

const ATTRIBUTE_NAME = /^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/;

/** Local name without namespace prefix. */
export function localName(name: string): string {
    const colon = name.indexOf(':');
    return colon === -1 ? name : name.slice(colon + 1);
}

/** True for a MathML or SVG root element (`math`, `m:math`, `svg`, `svg:svg`, …). */
export function isForeignRoot(el: ElementNode): boolean {
    const local = localName(el.name).toLowerCase();
    return local === 'math' || local === 'svg';
}

function safeAttribute(name: string, rawValue: string, lookup?: EntityLookup): string | undefined {
    if (!ATTRIBUTE_NAME.test(name)) {
        return undefined; // control characters, markup, odd prefixes
    }
    const isXml = name.startsWith('xml:');
    const local = isXml ? name : localName(name);
    const lower = local.toLowerCase();
    if (lower.startsWith('on') || lower === 'style' || lower === 'xmlns' || name.toLowerCase().startsWith('xmlns:')
        || lower === 'src' || lower === 'srcset' || lower === 'formaction' || lower === 'action') {
        return undefined;
    }
    const value = decodeXmlText(rawValue, lookup);
    if (lower === 'href') {
        // Only same-document references (use, gradients, markers, clip paths).
        return /^#[\w.:-]+$/.test(value.trim()) ? ` href="${escapeAttr(value.trim())}"` : undefined;
    }
    if (/^\s*(javascript|vbscript|data):/i.test(value)) {
        return undefined;
    }
    return ` ${local}="${escapeAttr(value)}"`;
}

/** Serialize a MathML/SVG subtree as browser-renderable HTML. */
export function renderForeign(node: CstNode, doc: Document, lookup?: EntityLookup): string {
    switch (node.type) {
        case 'text':
            return escapeHtml(decodeXmlText(node.raw, lookup));
        case 'cdata':
            return escapeHtml(doc.source.slice(node.range.start + 9, node.range.end - 3));
        case 'element': {
            const lower = localName(node.name).toLowerCase();
            if (DROP_SUBTREE.has(lower)) {
                return '';
            }
            const inner = node.children.map((c) => renderForeign(c, doc, lookup)).join('');
            const canonical = ALLOWED.get(lower);
            if (!canonical) {
                return inner; // unknown or HTML-island element: keep its text, drop its markup
            }
            const attrs = node.attrs
                .map((a) => safeAttribute(a.name, a.value, lookup))
                .filter((a): a is string => a !== undefined)
                .join('');
            return `<${canonical}${attrs}>${inner}</${canonical}>`;
        }
        default:
            return '';
    }
}

/** First MathML/SVG root inside `el` (or `el` itself). */
export function findForeignRoot(el: ElementNode): ElementNode | undefined {
    if (isForeignRoot(el)) {
        return el;
    }
    for (const child of el.children) {
        if (isElement(child)) {
            const found = findForeignRoot(child);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}
