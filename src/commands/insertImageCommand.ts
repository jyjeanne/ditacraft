/**
 * Insert Image Command
 * Browses for an image file and inserts an `<image>` element at the
 * cursor — wrapped in a `<fig><title>…</title>…</fig>` skeleton when a
 * caption is given, or bare otherwise.
 *
 * **v1 deliberately skips checking whether `<fig>` is valid at the
 * cursor's containing element.** That check would need the server-side
 * content-model data in `server/src/data/ditaSchema.ts`, which lives on
 * the LSP process — the client (`src/commands/`) has no import path to it
 * under this project's client-server split (see CLAUDE.md: "client
 * extension handles UI commands... a separate LSP server handles all
 * language intelligence"). If the wrapper is actually invalid at that
 * position, the existing DTD/content-model validation phase already flags
 * it immediately as a normal diagnostic — the author gets the same
 * feedback loop as hand-typing invalid markup, at zero new plumbing cost.
 *
 * **Polish pass:** picking an image from outside the workspace (e.g. the
 * OS file picker's Downloads/Desktop default) now offers to copy it into
 * an `images/` folder next to the topic rather than only being able to
 * reference it at its original location (or, on a different drive, being
 * unable to reference it at all — see `computeImageHref`'s doc comment).
 * An optional width/height or scale can also be set on the inserted
 * `<image>` — both are real DITA `<image>` attributes (`NMTOKEN`-typed
 * per the OASIS DTD's `image.attributes` entity, in this project's
 * `dtds` directory under `base/dtd/commonElements.mod`), not an
 * invented extension.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { isDitaContentUri } from '../utils/constants';
import { logger } from '../utils/logger';
import { escapeXml } from '../utils/xmlUtils';
import { indentContinuationLines, insertAtCursor } from '../utils/editorInsertUtils';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp'];

/** Optional sizing attributes for the inserted `<image>` element. */
export interface ImageSizeAttrs {
    width?: string;
    height?: string;
    scale?: string;
}

/**
 * Command: ditacraft.insertImage
 */
export async function insertImageCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isEligibleDocument(editor.document.uri)) {
        vscode.window.showWarningMessage('DitaCraft: Open a DITA topic, map, or bookmap to insert an image.');
        return;
    }

    const documentDir = path.dirname(editor.document.uri.fsPath);

    const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { Images: IMAGE_EXTENSIONS },
        defaultUri: vscode.Uri.file(documentDir),
        openLabel: 'Insert Image'
    });
    if (!picked || picked.length === 0) return; // user cancelled the browse

    const href = await resolveImageHref(picked[0], documentDir);
    if (href === undefined) return; // resolution failed or the user cancelled a prompt along the way

    const captionInput = await vscode.window.showInputBox({
        title: 'Image Caption (optional)',
        prompt: 'Leave empty to insert a bare <image> element without a <fig> wrapper'
    });
    if (captionInput === undefined) return; // escape cancels the whole insert
    const caption = captionInput.trim();

    const altInput = await vscode.window.showInputBox({
        title: 'Alt Text (recommended for accessibility)',
        prompt: 'Describes the image for screen readers — leave empty and DITA-SCH-030 will flag it as a reminder',
        value: caption
    });
    if (altInput === undefined) return;
    const alt = altInput.trim();

    const size = await promptForImageSize();
    if (size === null) return; // escape at the size-choice step cancels the whole insert

    const snippet = buildImageSnippet(href, caption, alt, size);
    const inserted = await insertAtCursor(editor, snippet);
    if (!inserted) {
        vscode.window.showErrorMessage('DitaCraft: Failed to insert image markup.');
        return;
    }
    logger.info('Image inserted', { href, wrapped: caption.length > 0, size });
}

/**
 * True for the DITA content file types an `<image>` can meaningfully be
 * inserted into. Deliberately excludes `.ditaval` — a filter file isn't
 * content and can't contain image markup — which is exactly what
 * `isDitaContentUri` (as opposed to the broader `isDitaUri`, which does
 * include `.ditaval`) checks; kept as a locally-named wrapper so this
 * module's own eligibility intent stays self-documenting at call sites.
 */
export function isEligibleDocument(uri: vscode.Uri): boolean {
    return isDitaContentUri(uri);
}

/**
 * Resolve the href to insert for a picked image file, offering to copy it
 * into an `images/` folder next to the topic first if it's outside the
 * workspace entirely (the OS file picker often defaults to Downloads/
 * Desktop, and a relative href pointing outside the workspace is fragile —
 * it breaks the moment the workspace is copied/cloned elsewhere). Returns
 * undefined if the user cancels any prompt along the way, or if no
 * relative path can be computed at all (see `computeImageHref`).
 */
async function resolveImageHref(picked: vscode.Uri, documentDir: string): Promise<string | undefined> {
    // `/code-review` correctness fix: gating solely on getWorkspaceFolder()
    // meant every image insert forced this prompt when NO workspace/folder
    // was open at all (a single file opened directly) — getWorkspaceFolder
    // returns undefined for everything in that mode, not just for images
    // genuinely outside the document's own directory. "Copy into the
    // workspace" is meaningless when there's no workspace to copy into, so
    // that case now falls straight through to the original v1 behavior
    // instead of prompting.
    const workspaceIsOpen = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
    const pickedIsInWorkspace = workspaceIsOpen && vscode.workspace.getWorkspaceFolder(picked) !== undefined;

    if (!workspaceIsOpen || pickedIsInWorkspace) {
        return reportUnresolvableHref(computeImageHref(documentDir, picked.fsPath));
    }

    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(cloud-download) Copy into an images/ folder next to this topic (recommended)', value: 'copy' as const },
            { label: '$(link-external) Reference the file at its current location', value: 'reference' as const }
        ],
        {
            title: 'Image Is Outside the Workspace',
            placeHolder: `${path.basename(picked.fsPath)} isn't in this workspace — copy it in, or link to it where it is?`
        }
    );
    if (!choice) return undefined; // escape cancels the whole insert

    if (choice.value === 'reference') {
        return reportUnresolvableHref(computeImageHref(documentDir, picked.fsPath));
    }

    try {
        const targetDir = path.join(documentDir, 'images');
        const copiedPath = await copyImageIntoDirectory(picked.fsPath, targetDir);
        return computeImageHref(documentDir, copiedPath);
    } catch (error) {
        logger.error('Failed to copy image into workspace', error);
        vscode.window.showErrorMessage(
            `DitaCraft: Failed to copy the image into the workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return undefined;
    }
}

/** Surfaces `computeImageHref`'s cross-drive failure as a user-facing error, passing through a successful result unchanged. */
function reportUnresolvableHref(href: string | undefined): string | undefined {
    if (href === undefined) {
        vscode.window.showErrorMessage(
            'DitaCraft: Cannot compute a relative path to the selected image (it is not on the same drive as this document). Move or copy the image under the workspace first.'
        );
    }
    return href;
}

/**
 * Copy `sourcePath` into `targetDir` (creating it if needed), returning the
 * full path it was copied to. Exported for testing.
 *
 * If a file with the same basename already exists in `targetDir`:
 * - and its content is byte-identical to the source, the existing file is
 *   reused rather than writing a duplicate copy — re-running Insert Image
 *   with the same source file shouldn't accumulate `photo-1.png`,
 *   `photo-2.png`, … copies of the exact same bytes.
 * - and its content differs, a numbered suffix is appended instead
 *   (`photo.png` → `photo-1.png` → `photo-2.png`, …) so an unrelated file
 *   that happens to share a basename is never silently overwritten.
 */
export async function copyImageIntoDirectory(sourcePath: string, targetDir: string): Promise<string> {
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(sourcePath);
    const base = path.basename(sourcePath, ext);
    const sourceContent = await fs.readFile(sourcePath);

    let suffix = 0;
    for (;;) {
        const candidateName = suffix === 0 ? `${base}${ext}` : `${base}-${suffix}${ext}`;
        const candidatePath = path.join(targetDir, candidateName);

        try {
            const existingContent = await fs.readFile(candidatePath);
            if (existingContent.equals(sourceContent)) {
                return candidatePath; // Identical file already there — reuse it, no duplicate copy.
            }
            // Different content at this name — fall through to try the next suffix.
        } catch (error) {
            // `/code-review` correctness fix: only ENOENT means "nothing at
            // this path yet, safe to write" — any other error (a transient
            // lock from an indexer/antivirus, a permissions problem, ...)
            // must not be treated the same way, or it would silently
            // overwrite a file that's actually still there, directly
            // contradicting this function's own "never silently
            // overwritten" contract for an unrelated same-named file.
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
            await fs.writeFile(candidatePath, sourceContent);
            return candidatePath;
        }

        suffix++;
    }
}

/**
 * Compute the href to insert: relative to the *document's own directory*,
 * not the workspace root — the same resolution base every href in a DITA
 * file uses (see `referenceParser.ts`/`KeySpaceService` on the server).
 * Always forward-slashed, since DITA hrefs are URI references regardless
 * of the authoring platform.
 *
 * Returns undefined when the image isn't reachable by a relative path at
 * all — e.g. a different drive letter than the document on Windows.
 * `path.relative()` has no common root to work from in that case and
 * falls back to returning the absolute target path unchanged, which is
 * not a valid relative href; inserting it as one would silently produce
 * broken markup, so the caller must handle this instead.
 */
export function computeImageHref(documentDir: string, imagePath: string): string | undefined {
    const relative = path.relative(documentDir, imagePath);
    if (path.isAbsolute(relative)) {
        return undefined;
    }
    return relative.split(path.sep).join('/');
}

/**
 * Ask whether the inserted `<image>` should carry width/height or a scale
 * percentage. Returns `undefined` (no attributes) when the user picks "no
 * size attributes", a populated `ImageSizeAttrs` when they set one, or
 * `null` specifically to signal "the user cancelled" — distinct from
 * `undefined`'s "cancelled *this step only*, insert without size
 * attributes" would be, since every other prompt in this command treats
 * Escape as cancelling the whole insert, not just skipping one field.
 */
async function promptForImageSize(): Promise<ImageSizeAttrs | undefined | null> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(circle-slash) No size attributes', value: 'none' as const },
            { label: '$(arrow-both) Set width / height', value: 'dimensions' as const },
            { label: '$(zoom-in) Set scale (%)', value: 'scale' as const }
        ],
        {
            title: 'Image Size (optional)',
            placeHolder: 'Leave the image at its natural size, or constrain it'
        }
    );
    if (!choice) return null;
    if (choice.value === 'none') return undefined;

    if (choice.value === 'dimensions') {
        const width = await promptForNmtokenValue('Width', 'e.g. 200 (pixels) — leave empty to omit');
        if (width === undefined) return null;
        const height = await promptForNmtokenValue('Height', 'e.g. 150 (pixels) — leave empty to omit');
        if (height === undefined) return null;

        // `/code-review` fix: both fields left empty must resolve to the
        // same "no size chosen" value the scale branch below already uses
        // (undefined) — not an empty-but-defined {}, which is a different
        // sentinel for what should be an identical outcome.
        if (width.length === 0 && height.length === 0) return undefined;

        const size: ImageSizeAttrs = {};
        if (width.length > 0) size.width = width;
        if (height.length > 0) size.height = height;
        return size;
    }

    const scale = await promptForNmtokenValue('Scale (%)', 'e.g. 50 — leave empty to omit');
    if (scale === undefined) return null;
    return scale.length > 0 ? { scale } : undefined;
}

/**
 * Prompt for a DITA `NMTOKEN`-safe value (width/height/scale are all
 * `NMTOKEN`-typed per the OASIS DTD — no spaces, `%`, or other punctuation
 * beyond `. - _ :`). Returns the trimmed value (possibly empty, meaning
 * "omit this attribute"), or `undefined` if the prompt is cancelled.
 */
async function promptForNmtokenValue(title: string, prompt: string): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        title,
        prompt,
        validateInput: value => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return undefined; // empty is valid — means "omit"
            return /^[\w.:-]+$/.test(trimmed)
                ? undefined
                : 'Must be a plain number or simple token (no spaces or %) — DITA\'s width/height/scale attributes are NMTOKEN values.';
        }
    });
    return input?.trim();
}

/**
 * Build the markup to insert: a bare `<image/>` when no caption is given,
 * or a `<fig><title>…</title>…</fig>` skeleton when one is. Alt text is
 * emitted as an `<alt>` child element, not the `@alt` attribute — the
 * attribute form is deprecated (`DITA-SCH-011`) for DITA 1.0-1.3, so using
 * it here would make every inserted image with alt text immediately flag
 * a warning on the very markup this command just generated.
 */
export function buildImageSnippet(href: string, caption: string, alt: string, size?: ImageSizeAttrs): string {
    const imageEl = buildImageElement(href, alt, size);
    if (caption.length === 0) {
        return imageEl;
    }
    return `<fig>\n    <title>${escapeXml(caption)}</title>\n    ${indentContinuationLines(imageEl, '    ')}\n</fig>`;
}

function buildImageElement(href: string, alt: string, size?: ImageSizeAttrs): string {
    const attrs = [`href="${escapeXml(href)}"`];
    if (size?.width) attrs.push(`width="${escapeXml(size.width)}"`);
    if (size?.height) attrs.push(`height="${escapeXml(size.height)}"`);
    if (size?.scale) attrs.push(`scale="${escapeXml(size.scale)}"`);
    const attrsText = attrs.join(' ');

    if (alt.length === 0) {
        return `<image ${attrsText}/>`;
    }
    return `<image ${attrsText}>\n    <alt>${escapeXml(alt)}</alt>\n</image>`;
}
