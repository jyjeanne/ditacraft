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
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DITA_EXTENSIONS } from '../utils/constants';
import { logger } from '../utils/logger';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp'];

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

    const href = computeImageHref(documentDir, picked[0].fsPath);

    const captionInput = await vscode.window.showInputBox({
        title: 'Image Caption (optional)',
        prompt: 'Leave empty to insert a bare <image> element without a <fig> wrapper'
    });
    if (captionInput === undefined) return; // escape cancels the whole insert
    const caption = captionInput.trim();

    const altInput = await vscode.window.showInputBox({
        title: 'Alt Text (recommended for accessibility)',
        prompt: 'Describes the image for screen readers — leave empty and DITA-SCH-011 will flag it as a reminder',
        value: caption
    });
    if (altInput === undefined) return;
    const alt = altInput.trim();

    const snippet = buildImageSnippet(href, caption, alt);
    const inserted = await insertAtCursor(editor, snippet);
    if (!inserted) {
        vscode.window.showErrorMessage('DitaCraft: Failed to insert image markup.');
        return;
    }
    logger.info('Image inserted', { href, wrapped: caption.length > 0 });
}

/**
 * True for the DITA content file types an `<image>` can meaningfully be
 * inserted into. Deliberately excludes `.ditaval` (in `DITA_EXTENSIONS.
 * ALL_WITH_DITAVAL` but not `.ALL`) — a filter file isn't content and
 * can't contain image markup.
 */
export function isEligibleDocument(uri: vscode.Uri): boolean {
    const lower = uri.fsPath.toLowerCase();
    return DITA_EXTENSIONS.ALL.some(ext => lower.endsWith(ext));
}

/**
 * Compute the href to insert: relative to the *document's own directory*,
 * not the workspace root — the same resolution base every href in a DITA
 * file uses (see `referenceParser.ts`/`KeySpaceService` on the server).
 * Always forward-slashed, since DITA hrefs are URI references regardless
 * of the authoring platform.
 */
export function computeImageHref(documentDir: string, imagePath: string): string {
    const relative = path.relative(documentDir, imagePath);
    return relative.split(path.sep).join('/');
}

/**
 * Build the markup to insert: a bare `<image/>` when no caption is given,
 * or a `<fig><title>/><image/></fig>` skeleton when one is.
 */
export function buildImageSnippet(href: string, caption: string, alt: string): string {
    const altAttr = alt.length > 0 ? ` alt="${escapeXml(alt)}"` : '';
    const imageEl = `<image href="${escapeXml(href)}"${altAttr}/>`;
    if (caption.length === 0) {
        return imageEl;
    }
    return `<fig>\n    <title>${escapeXml(caption)}</title>\n    ${imageEl}\n</fig>`;
}

/**
 * Mirrors the escaping already used for generated markup on the server
 * side (`contextSnapshot.ts`'s identical `escapeXml` helper) — client and
 * server can't share code across the package boundary this project
 * maintains, so this is a parallel copy, not a duplicate import.
 */
function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Insert `snippet` at the cursor, re-indenting continuation lines to match
 * the current line's leading whitespace so a multi-line `<fig>` skeleton
 * doesn't land flush-left against the document's existing indentation.
 */
async function insertAtCursor(editor: vscode.TextEditor, snippet: string): Promise<boolean> {
    const position = editor.selection.active;
    const indent = editor.document.lineAt(position.line).text.match(/^[ \t]*/)?.[0] ?? '';
    const indented = snippet.split('\n').map((line, i) => (i === 0 ? line : indent + line)).join('\n');
    return editor.edit(editBuilder => editBuilder.insert(position, indented));
}
