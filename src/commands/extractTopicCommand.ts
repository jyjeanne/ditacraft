/**
 * Extract Topic From Section (§5.4)
 * Select (or place the cursor inside) a `<section>` in the active `.dita`
 * topic, extract it into a new standalone topic file, and replace the
 * original span with an `<xref>` pointing at it.
 *
 * DOCTYPE/root-element selection for the new file matches the *source*
 * topic's own type (concept section -> new concept, reference section ->
 * new reference, anything else -> generic `<topic>`) rather than always
 * defaulting to the generic topic — the safest choice a `<section>` can
 * imply, since a `<taskbody>` doesn't allow `<section>` as a child at all
 * (DITA's task content model uses `<context>`/`<steps>`/`<result>`
 * instead), so a task source is detected and blocked with a clear message
 * rather than silently producing structurally-wrong content.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from '../utils/logger';
import { escapeXml } from '../utils/xmlUtils';
import { pathExists } from '../utils/pathUtils';
import { validateFileName } from './fileCreationCommands';
import { findEnclosingSection } from '../utils/sectionExtractor';

const ROOT_TAG_PATTERN = /<([a-zA-Z][\w-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*\/?>/;

export type NewTopicType = 'concept' | 'reference' | 'topic';

/**
 * Command: ditacraft.extractTopicFromSection
 */
export async function extractTopicFromSectionCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('DitaCraft: No file is currently open.');
        return;
    }
    if (!editor.document.uri.fsPath.toLowerCase().endsWith('.dita')) {
        vscode.window.showWarningMessage('DitaCraft: Extract Topic requires a .dita topic file.');
        return;
    }

    const document = editor.document;
    const text = document.getText();
    const offset = document.offsetAt(editor.selection.active);

    const section = findEnclosingSection(text, offset);
    if (!section) {
        vscode.window.showWarningMessage('DitaCraft: Place the cursor inside a <section> element to extract it.');
        return;
    }

    const topicType = detectNewTopicType(text);
    if (topicType === undefined) {
        vscode.window.showWarningMessage(
            'DitaCraft: This topic is a <task>, whose <taskbody> can\'t contain a <section> in valid DITA -- extraction is not supported here.'
        );
        return;
    }

    const title = await vscode.window.showInputBox({
        title: 'New Topic Title',
        prompt: 'Title for the extracted topic',
        value: section.title ?? '',
        validateInput: v => (v.trim().length === 0 ? 'Enter a title' : undefined)
    });
    if (!title) return; // escape cancels; empty rejected by validateInput above

    const fileName = await vscode.window.showInputBox({
        title: 'New Topic File Name',
        prompt: 'File name (without extension), created next to the current file',
        value: slugify(title),
        validateInput: validateFileName
    });
    if (!fileName) return;

    const sourceDir = path.dirname(document.uri.fsPath);
    const newFilePath = path.join(sourceDir, `${fileName}.dita`);

    if (await pathExists(newFilePath)) {
        vscode.window.showErrorMessage(`DitaCraft: File already exists: ${fileName}.dita`);
        return;
    }

    const newContent = buildExtractedTopicContent(topicType, fileName, title, section.bodyContent);

    try {
        await vscode.workspace.fs.writeFile(vscode.Uri.file(newFilePath), Buffer.from(newContent, 'utf8'));
    } catch (error) {
        logger.error('Failed to write extracted topic file', error);
        vscode.window.showErrorMessage(
            `DitaCraft: Could not create ${fileName}.dita: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
    }

    const replacement = `<p><xref href="${escapeXml(`${fileName}.dita`)}">${escapeXml(title)}</xref></p>`;
    const applied = await editor.edit(editBuilder => {
        const range = new vscode.Range(document.positionAt(section.start), document.positionAt(section.end));
        editBuilder.replace(range, replacement);
    });

    if (!applied) {
        vscode.window.showWarningMessage(
            `DitaCraft: ${fileName}.dita was created, but the source file could not be updated -- replace the section with an xref manually.`
        );
    }

    logger.info('Extracted topic from section', { newFilePath, topicType });

    const newDocument = await vscode.workspace.openTextDocument(newFilePath);
    await vscode.window.showTextDocument(newDocument, vscode.ViewColumn.Beside);

    vscode.window.showInformationMessage(`DitaCraft: Extracted "${title}" to ${fileName}.dita`);
}

/**
 * Detect the source topic's root element and map it to the new topic's
 * type. Returns `undefined` for `<task>` (unsupported -- see module doc
 * comment) and falls back to generic `topic` for anything else, including
 * an already-generic `<topic>` root or one this regex can't confidently
 * classify.
 */
export function detectNewTopicType(text: string): NewTopicType | undefined {
    const match = ROOT_TAG_PATTERN.exec(text);
    const rootName = match?.[1];
    if (rootName === 'task') return undefined;
    if (rootName === 'concept') return 'concept';
    if (rootName === 'reference') return 'reference';
    return 'topic';
}

/** Lowercase, hyphen-separated slug from a title, for pre-filling the file name prompt. Not validated -- `validateFileName` does that on the actual input. */
export function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

const BODY_TAG: Record<NewTopicType, { root: string; body: string; doctype: string }> = {
    concept: { root: 'concept', body: 'conbody', doctype: '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">' },
    reference: { root: 'reference', body: 'refbody', doctype: '<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">' },
    topic: { root: 'topic', body: 'body', doctype: '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">' }
};

/**
 * Build the new topic file's content from the extracted section's title
 * and body content. Unlike `fileCreationCommands.ts`'s
 * `generateTopicContent()` (which fills a brand-new file with canned
 * placeholder example text), this inserts the *real* extracted content --
 * a different enough purpose that reusing that generator directly would
 * mean stripping its placeholders back out. `id` is the file name, the
 * same convention `newTopicCommand` already uses.
 */
export function buildExtractedTopicContent(topicType: NewTopicType, id: string, title: string, bodyContent: string): string {
    const { root, body, doctype } = BODY_TAG[topicType];
    const bodyBlock = bodyContent.length > 0 ? `\n        ${bodyContent}\n    ` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
${doctype}
<${root} id="${escapeXml(id)}">
    <title>${escapeXml(title)}</title>
    <${body}>${bodyBlock}</${body}>
</${root}>
`;
}
