/**
 * Inline Conref
 * Backs the `dita/computeInlineConrefEdit` request: given a cursor
 * position on/inside an element carrying a `conref` or `conkeyref`
 * attribute, resolves the referenced element's content from its target
 * file and returns a `WorkspaceEdit` that splices that content into the
 * referencing element in place, with the reference attribute removed.
 *
 * "Inline" here means the *content*, not a copy of the target element
 * itself — the referencing element's own opening tag (tag name, every
 * other attribute, any `id` it already had) is kept, only the
 * `conref`/`conkeyref` attribute is stripped and its (fresh, spliced-in)
 * content replaces whatever the referencing element previously had
 * between its tags. This deliberately never copies the target element's
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
import { stripCommentsAndCDATA, offsetToRange, uriToPath, isPathWithinWorkspace } from '../utils/textUtils';
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
        const end = isSelfClosing ? openTagEnd : findClosingTagEnd(searchableText, tagName, openTagEnd);
        if (end === undefined) continue;

        if (start <= offset && offset <= end) {
            if (!best || (end - start) < (best.end - best.start)) {
                best = {
                    start,
                    end,
                    openTagEnd,
                    tagName,
                    attrType: conrefMatch ? 'conref' : 'conkeyref',
                    attrValue: (conrefMatch ?? conkeyrefMatch)![1],
                };
            }
        }
    }

    return best;
}

/** The referencing element's own opening tag, minus its conref/conkeyref attribute and forced non-self-closing (it's about to get content). */
function buildOpenTagWithoutRefAttr(sourceContent: string, refElement: ConrefElement): string {
    let openTag = sourceContent.slice(refElement.start, refElement.openTagEnd);
    const attrPattern = new RegExp(`\\s+${refElement.attrType}\\s*=\\s*(["'])[^"']*\\1`);
    openTag = openTag.replace(attrPattern, '');
    openTag = openTag.replace(/\/\s*>$/, '>');
    return openTag;
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
    keySpaceService: KeySpaceService | undefined,
    workspaceFolders: readonly string[] = []
): Promise<InlineConrefResult> {
    const sourcePath = uriToPath(params.uri);
    const sourceContent = await readDocOrFile(documents, sourcePath);
    if (sourceContent === undefined) {
        return { edit: null, reason: 'Could not read the source file.' };
    }

    const refElement = findConrefElementAtOffset(sourceContent, params.offset);
    if (!refElement) {
        return { edit: null, reason: 'Place the cursor on an element with a conref or conkeyref attribute to inline it.' };
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

    const innerContent = stripNestedIds(getElementInnerContent(targetContent, targetExtent));
    const openTag = buildOpenTagWithoutRefAttr(sourceContent, refElement);
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
