/**
 * Helpers for the visual editor test suites.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { SYNTHETIC, type EditorSchema } from '../../shared/editor/schema';

/**
 * Structure, text and formatting of an editor document as a reader sees them, for checking
 * that written source reads back as the document that was edited. Layout spaces are
 * normalized: doubled, at paragraph edges, and on either side of a formatting boundary
 * (which side of `<b>` a space sits on is not visible); whitespace carries no formatting.
 * Comments and processing instructions are not read (hidden unless Show markup): next to
 * text they load as inline markers, between blocks as layout, the source being the same.
 * Their bytes are checked by the byte-exact suites.
 */
export function readingSignature(doc: PMNode, es: EditorSchema): string {
    let out = '';
    const walk = (node: PMNode, open: string[]): void => {
        if (node.type.name === SYNTHETIC.comment || node.type.name === SYNTHETIC.pi) {
            return;
        }
        if (node.isText && node.text!.trim() === '') {
            out += ' ';
            return;
        }
        if (node.isText || node.isInline) {
            const marks = node.marks.map((m) => es.markElement(m.type) ?? m.type.name).sort();
            for (const m of open.filter((x) => !marks.includes(x))) {
                out += `⟨/${m}⟩`;
            }
            for (const m of marks.filter((x) => !open.includes(x))) {
                out += `⟨${m}⟩`;
            }
            open.splice(0, open.length, ...marks);
        }
        if (node.isText) {
            out += node.text;
            return;
        }
        const name = es.role(node.type)?.element ?? node.type.name;
        out += name === 'textrun' ? '' : `⟪${name}⟫`;
        const inner: string[] = [];
        node.forEach((child) => walk(child, inner));
        for (const m of inner) {
            out += `⟨/${m}⟩`;
        }
        out += name === 'textrun' ? '' : `⟪/${name}⟫`;
    };
    walk(doc, []);
    return out
        .replace(/\s+/g, ' ')
        .replace(/\s*(⟪[^⟫]*⟫|⟨[^⟩]*⟩)\s*/g, '$1');
}
