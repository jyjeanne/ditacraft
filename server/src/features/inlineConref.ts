/**
 * Inline Conref
 * Backs the `dita/computeInlineConrefEdit` request: given a cursor
 * position on/inside an element carrying a `conref` or `conkeyref`
 * attribute, resolves the referenced element's content from its target
 * file and returns a `WorkspaceEdit` that splices that content into the
 * referencing element in place, with the reference attribute removed.
 *
 * The result is what DITA's conref resolution makes of the element (DITA
 * 1.3 §2.4.2.2, the rules the visual editor's "Replace with copy" follows
 * too — `src/editor/reuseCopy.ts`): the referencing element's tag name and
 * attributes as written, minus the consumed `conref`/`conkeyref` and any
 * attribute set to `-dita-use-conref-target`, plus every attribute of the
 * target element it does not set — except the target's `id` and `class`
 * (a relative `href`/`data`/… among them rewritten for its new place). The
 * target's content replaces whatever the referencing element had between
 * its tags, the relative references of its elements rewritten the same way
 * (`<xref href="other.dita"/>` copied from `shared/` into the folder above
 * becomes `shared/other.dita`; a same-file `#topic/el` or same-topic
 * `#./el` reference names the target's file — the copy's ids are stripped,
 * so it points at the original). A `conrefend` range or a `conaction` push is refused: it is not
 * one element. Before, only the content was copied, so `<note
 * conref="…"/>` reusing `<note type="important">` became a plain note.
 * This deliberately never copies the target element's
 * own `id`, *or any `id` on its descendants*, into the referencing
 * document — the target element (and everything inside it) is still
 * sitting unchanged in the target file, so splicing its ids in verbatim
 * would create an immediate duplicate-id violation the very next time the
 * file is validated (`DITA-ID-001` same-file, or `DITA-ID-003` cross-file
 * for a `conref`/`conkeyref` that points at a different file) — which
 * would defeat the point of a "safe" refactor.
 *
 * Resolution mirrors `definition.ts`'s existing conref/conkeyref
 * go-to-definition logic exactly, including its precedence rule for
 * conkeyref (`usageElementId || keyDef.elementId`) — this feature and
 * "jump to the conref target" are the same resolution problem with a
 * different final step (splice the content vs. navigate to it), so they
 * must never disagree about *which* element a given reference points to.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { stripCommentsAndCDATA, offsetToRange, uriToPath, isPathWithinWorkspace, effectiveWorkspaceFolders, normalizeFsPath } from '../utils/textUtils';
import { parseReference, getTargetId } from '../utils/referenceParser';
import { findElementExtentById, findClosingTagEnd, getElementInnerContent, ElementExtent } from '../utils/elementExtent';
import { KeySpaceService } from '../services/keySpaceService';

export interface InlineConrefParams {
    uri: string;
    offset: number;
}

export interface InlineConrefResult {
    edit: WorkspaceEdit | null;
    /** Set (and `edit` null) when nothing could be computed -- shown to the user as-is. */
    reason?: string;
}

interface ConrefElement extends ElementExtent {
    attrType: 'conref' | 'conkeyref';
    attrValue: string;
}

const OPEN_TAG_PATTERN = /<([\w-]+)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
const CONREF_ATTR_PATTERN = /\bconref\s*=\s*["']([^"']*)["']/;
const CONKEYREF_ATTR_PATTERN = /\bconkeyref\s*=\s*["']([^"']*)["']/;

/**
 * Find the innermost element containing `offset` that carries a `conref`
 * or `conkeyref` attribute. Mirrors `sectionExtractor.ts`'s
 * innermost-span-wins selection (same span definition compared on both
 * sides, per that module's own `/code-review` fix) generalized from a
 * fixed tag name to "any tag with one of these attributes."
 */
function findConrefElementAtOffset(text: string, offset: number): ConrefElement | undefined {
    const searchableText = stripCommentsAndCDATA(text);
    let best: ConrefElement | undefined;

    OPEN_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = OPEN_TAG_PATTERN.exec(searchableText)) !== null) {
        const tagName = match[1];
        const attrsText = match[2];
        const isSelfClosing = match[3] === '/';

        const conrefMatch = CONREF_ATTR_PATTERN.exec(attrsText);
        const conkeyrefMatch = CONKEYREF_ATTR_PATTERN.exec(attrsText);
        if (!conrefMatch && !conkeyrefMatch) continue;

        const start = match.index;
        const openTagEnd = match.index + match[0].length;
        const closeTag = isSelfClosing ? { start: openTagEnd, end: openTagEnd } : findClosingTagEnd(searchableText, tagName, openTagEnd);
        if (closeTag === undefined) continue;
        const end = closeTag.end;

        if (start <= offset && offset <= end) {
            if (!best || (end - start) < (best.end - best.start)) {
                best = {
                    start,
                    end,
                    openTagEnd,
                    closeTagStart: closeTag.start,
                    tagName,
                    attrType: conrefMatch ? 'conref' : 'conkeyref',
                    attrValue: (conrefMatch ?? conkeyrefMatch)![1],
                };
            }
        }
    }

    return best;
}

/** Attributes the resolution consumes. */
const CONSUMED = new Set(['conref', 'conkeyref', 'conrefend', 'conaction']);
const USE_TARGET = '-dita-use-conref-target';
/** Attributes holding a URI reference relative to the file they are written in. */
const REFERENCE_ATTRIBUTES = new Set(['href', 'conref', 'conrefend', 'data', 'codebase', 'longdescref']);

interface TagAttribute {
    name: string;
    /** As written (entity references kept): copied between documents unchanged. */
    value: string;
    quote: string;
    /** `[start, end)` in the tag's text, leading whitespace included. */
    start: number;
    end: number;
}

/** The attributes of an opening tag's text (`<name …>`). */
function tagAttributes(openTag: string): TagAttribute[] {
    const pattern = /\s+([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    const attributes: TagAttribute[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(openTag)) !== null) {
        attributes.push({
            name: match[1],
            value: match[2] ?? match[3],
            quote: match[2] !== undefined ? '"' : '\'',
            start: match.index,
            end: match.index + match[0].length,
        });
    }
    return attributes;
}

/**
 * The resolved element's opening tag (DITA 1.3 §2.4.2.2): the referencing
 * element's, as written, minus the consumed attributes and those set to
 * `-dita-use-conref-target`, then every attribute of the target's opening
 * tag it does not set — except `id` and `class` — with relative references
 * rebased by `rebaseReference`. Never self-closing: it gets the content.
 * Exported for testing.
 */
export function resolvedOpenTag(referencingTag: string, targetTag: string, rebaseReference: (value: string) => string): string {
    let tag = referencingTag;
    const own = tagAttributes(referencingTag);
    for (const a of [...own].reverse()) {
        if (CONSUMED.has(a.name) || a.value === USE_TARGET) {
            tag = tag.slice(0, a.start) + tag.slice(a.end);
        }
    }
    const kept = new Set(own.filter(a => !CONSUMED.has(a.name) && a.value !== USE_TARGET).map(a => a.name));
    const added = tagAttributes(targetTag)
        .filter(a => a.name !== 'id' && a.name !== 'class' && !CONSUMED.has(a.name) && a.value !== USE_TARGET && !kept.has(a.name))
        .map(a => ` ${a.name}=${a.quote}${REFERENCE_ATTRIBUTES.has(a.name) ? rebaseReference(a.value) : a.value}${a.quote}`)
        .join('');
    return `${tag.replace(/\s*\/?\s*>$/, '')}${added}>`;
}

/**
 * A URI reference written in `from`, rewritten to mean the same in `to`
 * (mirrors `rebase` in src/editor/reuseCopy.ts). `fromTopicId` names the
 * topic a same-topic reference (`#./el`) meant when it moves to another file.
 * Exported for testing.
 */
export function rebaseReference(value: string, from: string, to: string, fromTopicId: string | undefined): string {
    const v = value.trim();
    // A URI scheme has 2+ characters (C:\… is a Windows path); absolute paths stay.
    if (v === '' || /^[a-z][\w+.-]+:/i.test(v) || path.isAbsolute(v) || v.startsWith('/')) {
        return value;
    }
    const sameFile = normalizeFsPath(from) === normalizeFsPath(to);
    const hash = v.indexOf('#');
    const file = hash === -1 ? v : v.slice(0, hash);
    const fragment = hash === -1 ? undefined : v.slice(hash + 1);
    const uriPath = (relative: string): string => relative.split(path.sep).join('/').replace(/ /g, '%20');
    if (file === '') {
        if (sameFile) {
            return value;
        }
        const fromFile = uriPath(path.relative(path.dirname(to), from));
        if (fragment?.startsWith('./')) {
            return fromTopicId ? `${fromFile}#${fromTopicId}/${fragment.slice(2)}` : value;
        }
        return `${fromFile}#${fragment ?? ''}`;
    }
    if (normalizeFsPath(path.dirname(from)) === normalizeFsPath(path.dirname(to))) {
        return value;
    }
    let decoded = file;
    try {
        decoded = decodeURI(file);
    } catch {
        // Malformed escapes: use the reference as written.
    }
    const target = path.resolve(path.dirname(from), decoded);
    return uriPath(path.relative(path.dirname(to), target)) + (fragment === undefined ? '' : `#${fragment}`);
}

/**
 * `content` with the relative references of its start tags (`href`,
 * `conref`, `data`…) rewritten by `rebase`, everything else as written —
 * comments, CDATA sections and processing instructions included. Exported
 * for testing.
 */
export function rebaseContentReferences(content: string, rebase: (value: string) => string): string {
    const markup = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<[A-Za-z_][\w.:-]*((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
    let out = '';
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = markup.exec(content)) !== null) {
        if (match[1] === undefined) {
            continue; // a comment, CDATA section or processing instruction
        }
        let tag = match[0];
        for (const a of tagAttributes(tag).reverse()) {
            const value = REFERENCE_ATTRIBUTES.has(a.name) ? rebase(a.value) : a.value;
            if (value !== a.value) {
                const valueEnd = a.end - 1; // before the closing quote
                tag = tag.slice(0, valueEnd - a.value.length) + value + tag.slice(valueEnd);
            }
        }
        out += content.slice(last, match.index) + tag;
        last = match.index + match[0].length;
    }
    return out + content.slice(last);
}

/** The id of a file's root element (the topic a `#./el` reference in it means, for a one-topic file). */
function rootElementId(content: string): string | undefined {
    const root = stripCommentsAndCDATA(content).match(/<(?![?!])[\w.:-]+\b((?:[^>"']|"[^"]*"|'[^']*')*)>/);
    return root ? /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(root[1])?.slice(1).find(v => v !== undefined) : undefined;
}

/**
 * Strip every `id="..."`/`id='...'` attribute out of copied content --
 * not just the target element's own (already excluded by construction,
 * since only its *inner* content is copied), but any `id` on its
 * descendants too. See the module doc comment for why: those ids are
 * still sitting, unchanged, on the original elements in the target file,
 * so splicing them in verbatim would duplicate them the moment this file
 * is next validated.
 */
function stripNestedIds(content: string): string {
    return content.replace(/\s+id\s*=\s*(["'])[^"']*\1/g, '');
}

async function readDocOrFile(documents: TextDocuments<TextDocument>, filePath: string): Promise<string | undefined> {
    const openDoc = documents.get(URI.file(filePath).toString());
    if (openDoc) return openDoc.getText();
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return undefined;
    }
}

export async function handleComputeInlineConrefEdit(
    params: InlineConrefParams,
    documents: TextDocuments<TextDocument>,
    keySpaceService: KeySpaceService | undefined
): Promise<InlineConrefResult> {
    const sourcePath = uriToPath(params.uri);
    // Computed from the *source* document's own path, not the raw
    // workspace-folder list -- matches hover.ts/completion.ts/definition.ts's
    // own pattern: a loose file opened outside every configured workspace
    // folder has no workspace boundary to enforce for *its own* references
    // (see effectiveWorkspaceFolders's doc comment), so this must be
    // computed here rather than passed in pre-narrowed (or not narrowed at
    // all) by the caller.
    const workspaceFolders = effectiveWorkspaceFolders(sourcePath, keySpaceService?.getWorkspaceFolders() ?? []);
    const sourceContent = await readDocOrFile(documents, sourcePath);
    if (sourceContent === undefined) {
        return { edit: null, reason: 'Could not read the source file.' };
    }

    const refElement = findConrefElementAtOffset(sourceContent, params.offset);
    if (!refElement) {
        return { edit: null, reason: 'Place the cursor on an element with a conref or conkeyref attribute to inline it.' };
    }

    const referencingTag = sourceContent.slice(refElement.start, refElement.openTagEnd);
    if (tagAttributes(referencingTag).some(a => a.name === 'conrefend' || a.name === 'conaction')) {
        return { edit: null, reason: 'A conrefend range or a conaction push cannot be inlined as one element.' };
    }

    let targetFilePath: string | undefined;
    let targetElementId: string | undefined;

    if (refElement.attrType === 'conref') {
        const parsed = parseReference(refElement.attrValue);
        targetElementId = getTargetId(parsed.fragment);
        targetFilePath = parsed.filePath
            ? path.resolve(path.dirname(sourcePath), parsed.filePath)
            : sourcePath;
    } else {
        if (!keySpaceService) {
            return { edit: null, reason: 'No key space is available to resolve this conkeyref.' };
        }
        const slashIdx = refElement.attrValue.indexOf('/');
        const keyName = slashIdx >= 0 ? refElement.attrValue.slice(0, slashIdx) : refElement.attrValue;
        const usageElementId = slashIdx >= 0 ? refElement.attrValue.slice(slashIdx + 1) : '';

        const keyDef = await keySpaceService.resolveKey(keyName, sourcePath);
        if (!keyDef?.targetFile) {
            return { edit: null, reason: `Key "${keyName}" could not be resolved.` };
        }
        targetFilePath = keyDef.targetFile;
        // `keyDef.elementId` comes straight from the keydef's own href
        // fragment (e.g. "t/e1" for `href="shared.dita#t/e1"`), not just the
        // bare element id -- `getTargetId` narrows it to the last segment the
        // same way it already does for `conref`'s own fragment above.
        targetElementId = usageElementId || (keyDef.elementId ? getTargetId(keyDef.elementId) : undefined);
    }

    if (!targetElementId) {
        return { edit: null, reason: 'This reference has no target element id to inline.' };
    }
    if (!targetFilePath) {
        return { edit: null, reason: 'Could not determine the reference\'s target file.' };
    }
    // `definition.ts`'s own `resolveElementInFile` -- the function this
    // module's resolution deliberately mirrors -- gates every filesystem
    // read behind `isPathWithinWorkspace` so a relative `conref`/`conkeyref`
    // path (e.g. `conref="../../../../etc/passwd#x/y"`) can't be used to
    // read/splice content from outside the workspace. `keyDef.targetFile`
    // is already filtered this way inside `KeySpaceService` itself, but
    // `conref`'s own manually-`path.resolve`d target isn't, so the check is
    // applied here unconditionally to cover both paths the same way.
    if (!isPathWithinWorkspace(targetFilePath, workspaceFolders)) {
        return { edit: null, reason: 'The reference target is outside the workspace.' };
    }

    const targetContent = await readDocOrFile(documents, targetFilePath);
    if (targetContent === undefined) {
        return { edit: null, reason: `Could not read the target file: ${targetFilePath}` };
    }

    const targetExtent = findElementExtentById(targetContent, targetElementId);
    if (!targetExtent) {
        return { edit: null, reason: `Element with id "${targetElementId}" was not found in the target file.` };
    }

    const targetTag = targetContent.slice(targetExtent.start, targetExtent.openTagEnd);
    const targetTopicId = rootElementId(targetContent);
    const targetFile = targetFilePath;
    // Written in the target file, read in this one: relative references must be rewritten.
    const rebase = (value: string): string => rebaseReference(value, targetFile, sourcePath, targetTopicId);
    const innerContent = stripNestedIds(rebaseContentReferences(getElementInnerContent(targetContent, targetExtent), rebase));
    const openTag = resolvedOpenTag(referencingTag, targetTag, rebase);
    const replacement = `${openTag}${innerContent}</${refElement.tagName}>`;

    const edit: TextEdit = {
        range: offsetToRange(sourceContent, refElement.start, refElement.end),
        newText: replacement,
    };

    return { edit: { changes: { [params.uri]: [edit] } } };
}

// Re-exported for direct unit testing of the discovery logic.
export type { ConrefElement };
export { findConrefElementAtOffset };
