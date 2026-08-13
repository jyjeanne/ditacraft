/**
 * Publishing Profiles
 * Saved DITA-OT publish configurations (transtype/outputDir/ditavalPath/
 * additionalArgs) a user can pick from instead of re-configuring a publish
 * every time. Stored in `ditacraft.publishingProfiles` (workspace settings,
 * shareable via `.vscode/settings.json`) rather than any hidden extension
 * state directory — this project deliberately never creates its own folder
 * inside the user's workspace (see `src/utils/logger.ts`).
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DitaOtWrapper } from '../utils/ditaOtWrapper';
import { logger } from '../utils/logger';

/** A saved publishing configuration. Mirrors `PublishOptions` (minus `inputFile`,
 * which is always the file being published) so a profile is, structurally,
 * a reusable slice of the same options `DitaOtWrapper.publish()` takes. */
export interface PublishingProfile {
    name: string;
    transtype: string;
    outputDir?: string;
    ditavalPath?: string;
    additionalArgs?: string[];
}

const FALLBACK_TRANSTYPES = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];

/** Read the saved publishing profiles from workspace configuration. */
export function getPublishingProfiles(): PublishingProfile[] {
    return vscode.workspace.getConfiguration('ditacraft').get<PublishingProfile[]>('publishingProfiles', []);
}

async function savePublishingProfiles(profiles: PublishingProfile[]): Promise<void> {
    await vscode.workspace.getConfiguration('ditacraft')
        .update('publishingProfiles', profiles, vscode.ConfigurationTarget.Workspace);
}

/** Name of the most recently used profile, so the publish picker can surface it first. */
export function getLastUsedProfileName(): string | undefined {
    const name = vscode.workspace.getConfiguration('ditacraft').get<string>('lastUsedPublishingProfile', '');
    return name.length > 0 ? name : undefined;
}

export async function rememberLastUsedProfile(name: string): Promise<void> {
    await vscode.workspace.getConfiguration('ditacraft')
        .update('lastUsedPublishingProfile', name, vscode.ConfigurationTarget.Workspace);
}

/**
 * Resolve a profile's `ditavalPath` to an absolute path before handing it to
 * `DitaOtWrapper.publish()`. Stored values are workspace-relative (that's
 * what `promptForDitaval` writes via `asRelativePath`), but a hand-edited
 * `settings.json` could supply an absolute path directly — both are
 * accepted. Returns undefined if unset or no workspace folder is open to
 * resolve a relative path against.
 */
export function resolveDitavalPath(ditavalPath: string | undefined): string | undefined {
    if (!ditavalPath) return undefined;
    if (path.isAbsolute(ditavalPath)) return ditavalPath;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return undefined;

    return path.join(workspaceFolder.uri.fsPath, ditavalPath);
}

/**
 * Command: ditacraft.managePublishingProfiles
 * Add, edit, or delete saved publishing profiles via a QuickPick-driven
 * flow (cheaper to build and maintain than a WebView for a first cut —
 * revisit as a WebView only if this proves too limited in practice).
 */
export async function managePublishingProfilesCommand(): Promise<void> {
    for (;;) {
        const profiles = getPublishingProfiles();

        const items: (vscode.QuickPickItem & { profile?: PublishingProfile })[] = [
            { label: '$(add) Add New Profile...' },
            ...profiles.map(p => ({
                label: p.name,
                description: describeProfile(p),
                profile: p
            })),
        ];

        const selected = await vscode.window.showQuickPick(items, {
            title: 'Manage Publishing Profiles',
            placeHolder: profiles.length === 0
                ? 'No profiles yet — add one to reuse publish settings'
                : 'Select a profile to edit or delete, or add a new one'
        });

        if (!selected) return;

        if (!selected.profile) {
            const newProfile = await promptForProfile(profiles);
            if (newProfile) {
                await savePublishingProfiles([...profiles, newProfile]);
                logger.info(`Publishing profile "${newProfile.name}" created`);
            }
            continue;
        }

        const target = selected.profile;
        const action = await vscode.window.showQuickPick(
            [
                { label: '$(edit) Edit' },
                { label: '$(trash) Delete' },
                { label: '$(arrow-left) Back' }
            ],
            { title: `Profile: ${target.name}`, placeHolder: describeProfile(target) }
        );

        if (!action || action.label.includes('Back')) continue;

        if (action.label.includes('Delete')) {
            const confirm = await vscode.window.showWarningMessage(
                `Delete publishing profile "${target.name}"?`,
                { modal: true },
                'Delete'
            );
            if (confirm === 'Delete') {
                await savePublishingProfiles(profiles.filter(p => p.name !== target.name));
                logger.info(`Publishing profile "${target.name}" deleted`);
            }
            continue;
        }

        // Edit
        const updated = await promptForProfile(profiles.filter(p => p.name !== target.name), target);
        if (updated) {
            await savePublishingProfiles(
                profiles.map(p => (p.name === target.name ? updated : p))
            );
            logger.info(`Publishing profile "${target.name}" updated`);
        }
    }
}

function describeProfile(p: PublishingProfile): string {
    const parts = [p.transtype];
    if (p.outputDir) parts.push(`→ ${p.outputDir}`);
    if (p.ditavalPath) parts.push(`filtered by ${p.ditavalPath}`);
    return parts.join('  ');
}

/**
 * Walk the user through defining (or editing) a profile. Returns undefined
 * if cancelled at any step. `otherProfiles` excludes the one being edited,
 * so a name-collision check doesn't reject renaming a profile to its own
 * current name.
 */
async function promptForProfile(
    otherProfiles: PublishingProfile[],
    existing?: PublishingProfile
): Promise<PublishingProfile | undefined> {
    const name = await vscode.window.showInputBox({
        title: existing ? 'Edit Profile Name' : 'New Publishing Profile',
        prompt: 'A short name for this profile (e.g. "PDF Release")',
        value: existing?.name,
        validateInput: (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return 'Name cannot be empty';
            if (otherProfiles.some(p => p.name === trimmed)) return `A profile named "${trimmed}" already exists`;
            return undefined;
        }
    });
    if (name === undefined) return undefined;

    const transtype = await pickTranstype(existing?.transtype);
    if (!transtype) return undefined;

    const outputDir = await vscode.window.showInputBox({
        title: 'Output Directory (optional)',
        prompt: 'Leave empty to use the default output directory (ditacraft.outputDirectory)',
        value: existing?.outputDir ?? ''
    });
    if (outputDir === undefined) return undefined;

    const ditavalPath = await promptForDitaval(existing?.ditavalPath);
    if (ditavalPath === undefined) return undefined;

    const additionalArgsRaw = await vscode.window.showInputBox({
        title: 'Additional DITA-OT Arguments (optional)',
        prompt: 'Space-separated extra arguments for this profile only, e.g. --verbose',
        value: existing?.additionalArgs?.join(' ') ?? ''
    });
    if (additionalArgsRaw === undefined) return undefined;

    const profile: PublishingProfile = { name: name.trim(), transtype };
    if (outputDir.trim().length > 0) profile.outputDir = outputDir.trim();
    if (ditavalPath.length > 0) profile.ditavalPath = ditavalPath;
    const additionalArgs = additionalArgsRaw.trim().split(/\s+/).filter(a => a.length > 0);
    if (additionalArgs.length > 0) profile.additionalArgs = additionalArgs;

    return profile;
}

/**
 * Ask whether this profile should filter its output through a `.ditaval`
 * file and, if so, let the user browse for one — a picker is more
 * discoverable than free-text for a path that must already exist, unlike
 * the profile's own name.
 */
async function promptForDitaval(existingPath?: string): Promise<string | undefined> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(circle-slash) No filter', value: '' },
            { label: '$(folder-opened) Browse for .ditaval file...', value: 'browse' }
        ],
        {
            title: 'DITAVAL Filter (optional)',
            placeHolder: existingPath ? `Currently: ${existingPath}` : 'This profile publishes unfiltered by default'
        }
    );
    if (!choice) return undefined;
    if (choice.value !== 'browse') return '';

    const workspaceFolders = vscode.workspace.workspaceFolders;
    const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { 'DITAVAL Files': ['ditaval'] },
        defaultUri: workspaceFolders?.[0]?.uri,
        openLabel: 'Use as filter'
    });
    if (!picked || picked.length === 0) return '';

    return workspaceFolders && workspaceFolders.length > 0
        ? vscode.workspace.asRelativePath(picked[0], false)
        : picked[0].fsPath;
}

/**
 * Prefer the transtypes DITA-OT itself reports (matching what the regular
 * publish picker shows) when a working installation is available; fall
 * back to a static list so profile creation isn't blocked on DITA-OT being
 * configured yet.
 */
async function pickTranstype(currentValue?: string): Promise<string | undefined> {
    let transtypes = FALLBACK_TRANSTYPES;
    try {
        const ditaOt = new DitaOtWrapper();
        const verification = await ditaOt.verifyInstallation();
        if (verification.installed) {
            const discovered = await ditaOt.getAvailableTranstypes();
            if (discovered.length > 0) transtypes = discovered;
        }
    } catch (error) {
        logger.debug('Falling back to static transtype list for profile creation', { error });
    }

    return vscode.window.showQuickPick(transtypes, {
        title: 'Output Format',
        placeHolder: currentValue ?? 'Select a DITA-OT transtype'
    });
}
