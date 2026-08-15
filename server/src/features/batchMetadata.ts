/**
 * Batch Metadata Update
 * Backs the `dita/computeBatchMetadataEdits` request: given a set of
 * files (a multi-selection in the DITA Explorer) and a profiling
 * attribute + value, sets (or, for an empty value, removes) that
 * attribute on every selected file's *root* element.
 *
 * Scoped to profiling attributes on the root element for v1 — not
 * `<prolog>` child metadata (`<author>`, `<critdates>`, ...), which have
 * their own DTD content models and insertion-order rules a bulk operation
 * would need to resolve per file; a real but separate follow-up, not
 * folded into this pass (see `docs/V0.9-IMPLEMENTATION-PLAN.md` §5.2).
 *
 * Validated against `SubjectSchemeService`'s controlled values — a value
 * a registered subject scheme doesn't allow for the attribute/root-element
 * combination is rejected per file (that file is skipped, not silently
 * written with an invalid value) rather than let a batch edit introduce
 * a `DITA-PROF-001` violation across many files at once.
 */

import * as fs from 'fs/promises';
import { TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SubjectSchemeQueries } from '../services/subjectSchemeService';
import { offsetToRange, escapeRegex, uriToPath } from '../utils/textUtils';

export interface BatchMetadataParams {
    fileUris: string[];
    attribute: string;
    /** Space-separated tokens to set. An empty string removes the attribute entirely. */
    value: string;
}

export interface BatchMetadataSkippedFile {
    uri: string;
    reason: string;
}

export interface BatchMetadataResult {
    edit: WorkspaceEdit | null;
    updatedCount: number;
    skipped: BatchMetadataSkippedFile[];
}

interface RootElementInfo {
    tagName: string;
    attrsText: string;
    /** Offset in the document where `attrsText` begins (just past `<tagName`). */
    attrsStart: number;
}

const ROOT_TAG_PATTERN = /<([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/;

/**
 * Find the document's root element — the first real tag after any XML
 * declaration/DOCTYPE/comments, none of which this pattern can match
 * (`<?`, `<!DOCTYPE`, `<!--` all fail `<[a-zA-Z]`). Returns undefined for
 * a document with no element at all (empty file, comments-only, ...).
 */
function findRootElement(content: string): RootElementInfo | undefined {
    const match = ROOT_TAG_PATTERN.exec(content);
    if (!match) {
        return undefined;
    }
    return {
        tagName: match[1],
        attrsText: match[2],
        attrsStart: match.index + 1 + match[1].length
    };
}

function escapeXmlAttrValue(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Compute the edit setting/removing `attribute` on a single file's root
 * element. Returns undefined when there is nothing to change (removing an
 * attribute that isn't present).
 */
function buildAttributeEdit(
    root: RootElementInfo,
    content: string,
    attribute: string,
    value: string
): TextEdit | undefined {
    const existingPattern = new RegExp(`\\s+${escapeRegex(attribute)}\\s*=\\s*(["'])[^"']*\\1`);
    const existingMatch = existingPattern.exec(root.attrsText);

    if (value.length === 0) {
        if (!existingMatch) {
            return undefined; // Nothing to remove.
        }
        const start = root.attrsStart + existingMatch.index;
        const end = start + existingMatch[0].length;
        return { range: offsetToRange(content, start, end), newText: '' };
    }

    const newFragment = ` ${attribute}="${escapeXmlAttrValue(value)}"`;
    if (existingMatch) {
        const start = root.attrsStart + existingMatch.index;
        const end = start + existingMatch[0].length;
        return { range: offsetToRange(content, start, end), newText: newFragment };
    }

    // Not present yet — insert right after the tag name, before any
    // existing attributes (exact position among several attributes
    // doesn't matter for XML validity).
    return { range: offsetToRange(content, root.attrsStart, root.attrsStart), newText: newFragment };
}

/**
 * Validate `value`'s space-separated tokens against a subject scheme's
 * controlled values for `attribute` on `elementName`. Returns an error
 * message if any token is disallowed, or undefined if the attribute isn't
 * controlled at all (nothing to validate) or every token is allowed.
 */
function validateAgainstSubjectScheme(
    subjectSchemeService: SubjectSchemeQueries,
    attribute: string,
    elementName: string,
    value: string
): string | undefined {
    if (value.length === 0 || !subjectSchemeService.isControlledAttribute(attribute)) {
        return undefined;
    }
    const validValues = subjectSchemeService.getValidValues(attribute, elementName);
    if (!validValues) {
        return undefined;
    }
    const invalidTokens = value.trim().split(/\s+/).filter(token => !validValues.has(token));
    if (invalidTokens.length === 0) {
        return undefined;
    }
    const allowed = [...validValues].sort().join(', ');
    return `"${invalidTokens.join(', ')}" not allowed for @${attribute} on <${elementName}> (allowed: ${allowed})`;
}

export async function handleComputeBatchMetadataEdits(
    params: BatchMetadataParams,
    documents: TextDocuments<TextDocument>,
    subjectSchemeService: SubjectSchemeQueries
): Promise<BatchMetadataResult> {
    if (params.fileUris.length === 0 || params.attribute.length === 0) {
        return { edit: null, updatedCount: 0, skipped: [] };
    }

    const changes: { [uri: string]: TextEdit[] } = {};
    const skipped: BatchMetadataSkippedFile[] = [];

    for (const fileUri of params.fileUris) {
        const filePath = uriToPath(fileUri);
        const openDoc = documents.get(fileUri);

        let content: string;
        if (openDoc) {
            content = openDoc.getText();
        } else {
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch (error) {
                skipped.push({ uri: fileUri, reason: `Could not read file: ${error instanceof Error ? error.message : 'unknown error'}` });
                continue;
            }
        }

        const root = findRootElement(content);
        if (!root) {
            skipped.push({ uri: fileUri, reason: 'No root element found' });
            continue;
        }

        const validationError = validateAgainstSubjectScheme(subjectSchemeService, params.attribute, root.tagName, params.value);
        if (validationError) {
            skipped.push({ uri: fileUri, reason: validationError });
            continue;
        }

        const edit = buildAttributeEdit(root, content, params.attribute, params.value);
        if (edit) {
            changes[fileUri] = [edit];
        }
        // No edit and no validation error means "already set to this value
        // / already absent" — not an error, just nothing to change; not
        // added to `skipped` since there's nothing the user needs to know.
    }

    const updatedCount = Object.keys(changes).length;
    return {
        edit: updatedCount > 0 ? { changes } : null,
        updatedCount,
        skipped
    };
}
