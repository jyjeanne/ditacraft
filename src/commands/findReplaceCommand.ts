/**
 * Multi-File DITA-Aware Find & Replace
 * Prompts for a search query (literal or regex) and a replacement, asks
 * the LSP server (`server/src/features/findReplace.ts`) to compute every
 * match across the DITA files in scope (text content only, or attribute
 * values too — never markup), then asks before writing, as VS Code's own
 * Replace All does (`confirmWorkspaceEdit`): **Replace** applies every
 * change (undoable), **Review Changes…** applies it as a `vscode.WorkspaceEdit`
 * with `needsConfirmation: true` on every entry — VS Code's native
 * multi-file "Refactor Preview", where such changes start unticked: the
 * user ticks the ones to apply. Applying a needs-confirmation edit straight
 * away opened that preview with nothing ticked, so Apply silently did
 * nothing.
 */

import * as vscode from 'vscode';
import { getLanguageClient } from '../languageClient';
import { logger } from '../utils/logger';
import { isDitaContentUri } from '../utils/constants';

// Mirrors server/src/features/findReplace.ts's response shape (raw LSP
// protocol shape, before conversion to a vscode.WorkspaceEdit) — client
// and server can't share types across the package boundary this project
// maintains, so this is a parallel, hand-mirrored copy, matching the
// established pattern for every other custom `dita/*` request's types
// (see extension.ts's own LspTextEdit/LspWorkspaceEdit for `dita/computeMoveEdits`).
interface LspTextEdit {
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    newText: string;
}
interface LspWorkspaceEdit {
    changes?: { [uri: string]: LspTextEdit[] };
}
interface FindReplaceResponse {
    edit: LspWorkspaceEdit | null;
    matchCount: number;
    fileCount: number;
}

type FindOption = 'caseSensitive' | 'useRegex' | 'wholeWord' | 'includeAttributeValues';

const FIND_OPTIONS: { label: string; description?: string; value: FindOption }[] = [
    { label: 'Match case', value: 'caseSensitive' },
    { label: 'Use regular expression', value: 'useRegex' },
    { label: 'Match whole word', value: 'wholeWord' },
    {
        label: 'Also in attribute values',
        description: 'ids, links, keys, navtitle… — text content only otherwise; tag and attribute names never change',
        value: 'includeAttributeValues'
    }
];

/**
 * Command: ditacraft.findReplaceInFiles
 */
export async function findReplaceInFilesCommand(): Promise<void> {
    const client = getLanguageClient();
    if (!client) {
        vscode.window.showWarningMessage('DITA Craft: Language server is not ready yet.');
        return;
    }

    const query = await vscode.window.showInputBox({
        title: 'Find in DITA Files',
        prompt: 'Text to search for across DITA files',
        validateInput: value => (value.length === 0 ? 'Enter text to search for' : undefined)
    });
    if (!query) return; // empty or escaped

    const optionChoices = await vscode.window.showQuickPick(FIND_OPTIONS, {
        canPickMany: true,
        title: 'Find Options',
        placeHolder: 'Toggle any that apply, or continue with none selected'
    });
    if (optionChoices === undefined) return; // escape cancels
    const options = parseFindOptions(optionChoices);

    if (options.useRegex) {
        const regexError = validateRegexQuery(query);
        if (regexError) {
            vscode.window.showErrorMessage(`DITA Craft: ${regexError}`);
            return;
        }
    }

    const replacement = await vscode.window.showInputBox({
        title: 'Replace With',
        prompt: options.useRegex
            ? 'Replacement text ($1, $2, … for capture groups; $$ for a literal $) — leave empty to delete matches'
            : 'Replacement text — leave empty to delete matches'
    });
    if (replacement === undefined) return; // escape cancels; empty string is a valid "delete matches" choice

    const scopeChoice = await vscode.window.showQuickPick(
        [
            { label: '$(folder-library) Entire workspace', value: 'workspace' as const },
            { label: '$(file) Current file only', value: 'file' as const }
        ],
        { title: 'Search Scope' }
    );
    if (!scopeChoice) return;

    let scopeUri: string | undefined;
    if (scopeChoice.value === 'file') {
        const activeUri = vscode.window.activeTextEditor?.document.uri;
        if (!activeUri) {
            vscode.window.showWarningMessage('DITA Craft: No active file to scope the search to.');
            return;
        }
        if (!isDitaContentUri(activeUri)) {
            // `/code-review` fix: the server now rejects a non-DITA
            // scopeUri too (defense in depth), but checking here avoids an
            // unnecessary round-trip and gives an immediate, specific
            // reason instead of a generic "no matches found".
            vscode.window.showWarningMessage('DITA Craft: The active file is not a DITA topic, map, or bookmap.');
            return;
        }
        scopeUri = client.code2ProtocolConverter.asUri(activeUri);
    }

    let response: FindReplaceResponse;
    try {
        response = await client.sendRequest<FindReplaceResponse>('dita/computeFindReplaceEdits', {
            query,
            replacement,
            useRegex: options.useRegex,
            caseSensitive: options.caseSensitive,
            wholeWord: options.wholeWord,
            includeAttributeValues: options.includeAttributeValues,
            scopeUri
        });
    } catch (error) {
        logger.error('Find & Replace request failed', error);
        vscode.window.showErrorMessage(
            `DITA Craft: Find & Replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
    }

    if (!response.edit || response.matchCount === 0) {
        vscode.window.showInformationMessage('DITA Craft: No matches found.');
        return;
    }

    const matchWord = response.matchCount === 1 ? 'match' : 'matches';
    const fileWord = response.fileCount === 1 ? 'file' : 'files';
    const choice = await confirmWorkspaceEdit(
        `Replace ${response.matchCount} ${matchWord} of "${query}" with "${replacement}" in ${response.fileCount} ${fileWord}?`,
        describeFileChanges(response.edit, 'match', 'matches'),
        'Replace'
    );
    if (!choice) {
        return;
    }

    const label = describeSearchLabel(query, replacement, response.matchCount, response.fileCount);
    const edit = buildWorkspaceEdit(response.edit, label, choice === 'review');
    const applied = await vscode.workspace.applyEdit(edit, { isRefactoring: true });

    if (applied) {
        logger.info('Find & Replace applied', { matchCount: response.matchCount, fileCount: response.fileCount, reviewed: choice === 'review' });
        if (choice === 'apply') {
            vscode.window.showInformationMessage(`DITA Craft: Replaced ${response.matchCount} ${matchWord} in ${response.fileCount} ${fileWord}.`);
        }
    } else {
        // The user can discard VS Code's own refactor-preview UI —
        // that's a normal outcome, not a failure worth an error message.
        logger.debug('Find & Replace edit was not applied (discarded in the preview)');
    }
}

/**
 * Ask before writing a multi-file edit, as VS Code's own Replace All does:
 * `'apply'` every change, `'review'` it in the Refactor Preview (where
 * changes that need confirmation start unticked — the dialog says so), or
 * undefined (cancelled). Shared with batch metadata.
 */
export async function confirmWorkspaceEdit(message: string, files: string, applyLabel: string): Promise<'apply' | 'review' | undefined> {
    const review = 'Review Changes…';
    const choice = await vscode.window.showInformationMessage(
        message,
        {
            modal: true,
            detail: `${files}\n\n${applyLabel} makes every change (Undo takes it back). ${review} lists them in the Refactor Preview: tick the ones to make, then Apply.`
        },
        applyLabel,
        review
    );
    return choice === applyLabel ? 'apply' : choice === review ? 'review' : undefined;
}

/**
 * The files of an edit with their change counts, one per line (workspace-
 * relative paths, at most `max`, then "…and N more files"). Exported for testing.
 */
export function describeFileChanges(lspEdit: LspWorkspaceEdit, singular: string, plural: string, max = 10): string {
    const files = Object.entries(lspEdit.changes ?? {}).map(([uriString, edits]) => {
        const count = `${edits.length} ${edits.length === 1 ? singular : plural}`;
        return `${vscode.workspace.asRelativePath(vscode.Uri.parse(uriString))} (${count})`;
    }).sort();
    const more = files.length - max;
    return [...files.slice(0, max), ...(more > 0 ? [`…and ${more} more ${more === 1 ? 'file' : 'files'}`] : [])].join('\n');
}

/** Reduce the multi-select QuickPick result to the option flags. Exported for testing. */
export function parseFindOptions(
    selected: readonly { value: FindOption }[]
): { caseSensitive: boolean; useRegex: boolean; wholeWord: boolean; includeAttributeValues: boolean } {
    const values = new Set(selected.map(item => item.value));
    return {
        caseSensitive: values.has('caseSensitive'),
        useRegex: values.has('useRegex'),
        wholeWord: values.has('wholeWord'),
        includeAttributeValues: values.has('includeAttributeValues')
    };
}

/** Returns an error message if `query` isn't a valid regex, or undefined if it is. Exported for testing. */
export function validateRegexQuery(query: string): string | undefined {
    try {
        new RegExp(query);
        return undefined;
    } catch (error) {
        return `Invalid regular expression: ${error instanceof Error ? error.message : 'unknown error'}`;
    }
}

/** Build the label shown atop VS Code's refactor-preview UI. Exported for testing. */
export function describeSearchLabel(query: string, replacement: string, matchCount: number, fileCount: number): string {
    const matchWord = matchCount === 1 ? 'match' : 'matches';
    const fileWord = fileCount === 1 ? 'file' : 'files';
    return `Find & Replace: "${query}" → "${replacement}" (${matchCount} ${matchWord} in ${fileCount} ${fileWord})`;
}

/**
 * Convert the server's raw LSP `WorkspaceEdit` shape into a
 * `vscode.WorkspaceEdit` labelled `label`. With `needsConfirmation`, every
 * entry is marked so, and `vscode.workspace.applyEdit()` shows VS Code's
 * native refactor-preview UI (entries unticked) instead of writing the
 * changes immediately. Exported for testing.
 */
export function buildWorkspaceEdit(lspEdit: LspWorkspaceEdit, label: string, needsConfirmation: boolean): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const metadata: vscode.WorkspaceEditEntryMetadata = { needsConfirmation, label };
    for (const [uriString, edits] of Object.entries(lspEdit.changes ?? {})) {
        const uri = vscode.Uri.parse(uriString);
        const vsEdits: [vscode.TextEdit, vscode.WorkspaceEditEntryMetadata][] = edits.map(e => [
            new vscode.TextEdit(
                new vscode.Range(
                    new vscode.Position(e.range.start.line, e.range.start.character),
                    new vscode.Position(e.range.end.line, e.range.end.character)
                ),
                e.newText
            ),
            metadata
        ]);
        edit.set(uri, vsEdits);
    }
    return edit;
}
