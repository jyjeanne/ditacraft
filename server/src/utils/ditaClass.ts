/**
 * The @class of DITA elements, and the compatibility of a content reference.
 *
 * DITA defines an element by its class ancestry, not its name: `<codeph>` is `+ topic/ph
 * pr-d/codeph`, a specialization of `<ph>`. A content reference may reuse the referencing element
 * itself or a specialization of it: "processors resolving conrefs SHOULD tolerate specializations
 * of valid elements" (DITA 1.3 §2.4.2.2), and "It is not valid to use @conrefend to reference a
 * more general version of an element (such as using <step> to reference an <li> element)"
 * (§3.12.13.7). DITA-OT 4.3.5 resolves the first case, generalizing the content, and fails the
 * second (DOTX010E).
 *
 * An element's class is its own @class when the document writes it (a project's specialization,
 * generalized content), else the default class of the OASIS document types for the document's
 * DITA version (`../data/ditaClasses.ts`, generated from the bundled DTDs).
 */

import { BASE_CLASSES, CLASS_OVERRIDES } from '../data/ditaClasses';
import { detectDitaVersion } from './ditaVersionDetector';
import type { DitaVersion } from './types';

/** The DITA version and document type that decide an element's default class. */
export interface ClassContext {
    version: DitaVersion;
    isMap: boolean;
}

/** The class table of a DITA version: 1.0 to 1.2 share the 1.2 classes. */
function tableVersion(version: DitaVersion): string {
    return version === '2.0' ? '2.0' : version === '1.3' || version === 'unknown' ? '1.3' : '1.2';
}

/** An entry of a class table: its own entries only (not `constructor` or `toString` of Object). */
function entry(table: Readonly<Record<string, string>> | undefined, name: string): string | undefined {
    return table && Object.prototype.hasOwnProperty.call(table, name) ? table[name] : undefined;
}

/** The default @class of an element in the OASIS document types, or undefined for an unknown element. */
export function defaultClass(name: string, context: ClassContext): string | undefined {
    const version = tableVersion(context.version);
    return (context.isMap ? entry(CLASS_OVERRIDES[`${version}/map`], name) : undefined)
        ?? entry(CLASS_OVERRIDES[version], name)
        ?? entry(BASE_CLASSES, name);
}

/** An element's class: its own @class when written, else its default class; undefined when unknown. */
export function elementClass(name: string, ownClass: string | undefined, context: ClassContext): string | undefined {
    const own = ownClass?.trim();
    return own ? own : defaultClass(name, context);
}

/** The class context of a document: its DITA version, and whether its root element is a map. */
export function documentClassContext(text: string): ClassContext {
    const version = detectDitaVersion(text);
    // The root element: the first start tag after the prolog (declarations, comments, PIs)
    const prolog = /^(?:\s|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE(?:[^[>]|\[[\s\S]*?\])*>)*<([A-Za-z_][\w.:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/;
    const root = prolog.exec(text.replace(/^﻿/, ''));
    if (!root) {
        return { version, isMap: false };
    }
    const ownClass = /(?:^|\s)class\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(root[2]);
    const rootClass = elementClass(root[1], ownClass?.[1] ?? ownClass?.[2], { version, isMap: true });
    return { version, isMap: classTokens(rootClass).includes('map/map') };
}

/** The `module/element` tokens of a class, most general first. */
export function classTokens(value: string | undefined): string[] {
    return value ? value.trim().split(/\s+/).filter(token => token.includes('/')) : [];
}

/**
 * Whether a content reference from an element of class `referencing` may reuse an element of
 * class `referenced`: the referenced element is the same type or a specialization, so its class
 * contains the most specific token of the referencing class. An unknown class (no @class and
 * not an OASIS element) is taken as compatible: the type cannot be known, and a false error must
 * not be reported.
 */
export function isReuseCompatible(referencing: string | undefined, referenced: string | undefined): boolean {
    const referencingTokens = classTokens(referencing);
    const own = referencingTokens[referencingTokens.length - 1];
    const tokens = classTokens(referenced);
    return own === undefined || tokens.length === 0 || tokens.includes(own);
}
