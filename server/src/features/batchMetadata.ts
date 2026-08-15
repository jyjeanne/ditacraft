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
import { SubjectSchemeQueries, SubjectSchemeService } from '../services/subjectSchemeService';
import { KeySpaceService } from '../services/keySpaceService';
import { offsetToRange, escapeRegex, uriToPath, stripCommentsAndCDATA } from '../utils/textUtils';
import { mapWithConcurrency, MAX_CONCURRENT_READS } from './workspaceValidation';

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
 * (`<?`, `<!DOCTYPE`, `<!--` all fail `<[a-zA-Z]`). Matches against a
 * comment/CDATA-blanked view of `content` (same `stripCommentsAndCDATA`
 * used by `findReplace.ts`/`profilingValidation.ts`) so a tag-like
 * fragment inside a leading comment — e.g. `<!-- TODO: <placeholder/> -->`
 * — can't be mistaken for the real root; blanking preserves line/column
 * structure, so the match's offsets still apply to the original `content`.
 * Returns undefined for a document with no element at all (empty file,
 * comments-only, ...).
 */
function findRootElement(content: string): RootElementInfo | undefined {
    const searchableText = stripCommentsAndCDATA(content);
    const match = ROOT_TAG_PATTERN.exec(searchableText);
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

interface FileOutcome {
    uri: string;
    edit?: TextEdit;
    skippedReason?: string;
}

/**
 * Compute the outcome for a single file: read its content (preferring an
 * open in-memory buffer), find its root element, validate the target value
 * against whichever subject scheme actually governs *this* file, and build
 * the attribute edit. Isolated into its own function so it can run under
 * bounded concurrency (`mapWithConcurrency`) across a multi-file batch.
 */
async function processFile(
    fileUri: string,
    documents: TextDocuments<TextDocument>,
    subjectSchemeService: SubjectSchemeService,
    keySpaceService: KeySpaceService | undefined,
    attribute: string,
    value: string
): Promise<FileOutcome> {
    const filePath = uriToPath(fileUri);
    const openDoc = documents.get(fileUri);

    let content: string;
    if (openDoc) {
        content = openDoc.getText();
    } else {
        try {
            content = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            return { uri: fileUri, skippedReason: `Could not read file: ${error instanceof Error ? error.message : 'unknown error'}` };
        }
    }

    const root = findRootElement(content);
    if (!root) {
        return { uri: fileUri, skippedReason: 'No root element found' };
    }

    // Resolve the subject scheme(s) that actually govern *this* file's
    // containing map, mirroring ValidationPipeline's own Phase 7 (which
    // this batch operation must stay in lockstep with — a value this batch
    // accepts must be exactly what per-file profiling validation would
    // also accept, or it can silently introduce a DITA-PROF-001 the next
    // time the file is validated). The shared `subjectSchemeService`
    // instance's already-registered state reflects whatever document was
    // last opened/validated, not necessarily any of the files in this
    // batch — a file picked straight from the DITA Explorer tree without
    // ever being opened would otherwise see no scheme data at all and
    // silently skip validation. `snapshotFor()` is a pure lookup keyed on
    // the explicit path list, so it's safe to call from several files
    // running concurrently even when they belong to different maps.
    let schemeQueries: SubjectSchemeQueries = subjectSchemeService;
    if (keySpaceService) {
        try {
            const schemePaths = await keySpaceService.getSubjectSchemePaths(filePath);
            schemeQueries = subjectSchemeService.snapshotFor(schemePaths);
        } catch {
            // Best effort: fall back to the shared service's current state
            // rather than fail the whole file over a scheme-resolution error.
        }
    }

    const validationError = validateAgainstSubjectScheme(schemeQueries, attribute, root.tagName, value);
    if (validationError) {
        return { uri: fileUri, skippedReason: validationError };
    }

    const edit = buildAttributeEdit(root, content, attribute, value);
    return { uri: fileUri, edit };
}

export async function handleComputeBatchMetadataEdits(
    params: BatchMetadataParams,
    documents: TextDocuments<TextDocument>,
    subjectSchemeService: SubjectSchemeService,
    keySpaceService?: KeySpaceService
): Promise<BatchMetadataResult> {
    if (params.fileUris.length === 0 || params.attribute.length === 0) {
        return { edit: null, updatedCount: 0, skipped: [] };
    }

    // `/code-review` fix: normalize once, centrally, rather than relying
    // solely on the client's own trim (`batchMetadataCommand.ts`) as the
    // only safeguard. Without this, a whitespace-only value (e.g. a
    // single space, however it arrives here) has `length > 0` but
    // `.trim().split(/\s+/)` on it yields `['']` -- an empty-string
    // "token" no subject scheme ever allows, so every file was skipped
    // with a confusing `"" not allowed for @attr...` error instead of the
    // attribute being removed as intended. Trimming leading/trailing
    // whitespace only (internal spaces still separate multiple values)
    // keeps `validateAgainstSubjectScheme` and `buildAttributeEdit` in
    // sync -- both branch on `value.length === 0` meaning "remove".
    const value = params.value.trim();

    const outcomes = await mapWithConcurrency(params.fileUris, MAX_CONCURRENT_READS, (fileUri) =>
        processFile(fileUri, documents, subjectSchemeService, keySpaceService, params.attribute, value)
    );

    const changes: { [uri: string]: TextEdit[] } = {};
    const skipped: BatchMetadataSkippedFile[] = [];

    for (const outcome of outcomes) {
        if (outcome.skippedReason) {
            skipped.push({ uri: outcome.uri, reason: outcome.skippedReason });
        } else if (outcome.edit) {
            changes[outcome.uri] = [outcome.edit];
        }
        // No edit and no skip reason means "already set to this value /
        // already absent" — not an error, just nothing to change; not
        // added to `skipped` since there's nothing the user needs to know.
    }

    const updatedCount = Object.keys(changes).length;
    return {
        edit: updatedCount > 0 ? { changes } : null,
        updatedCount,
        skipped
    };
}
