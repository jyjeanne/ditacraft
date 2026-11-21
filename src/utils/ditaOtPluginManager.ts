/**
 * DITA-OT Plugin Manager
 * Lists installed DITA-OT plugins, reads the online plugin registry, installs and uninstalls plugins.
 * The DITA-OT CLI is injected as a runner so parsing and argument building stay testable.
 */

import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { compareVersionStrings } from './ditaOtInstaller';
import {
    backupPluginFolder,
    discardPluginBackup,
    listPluginXmlFiles,
    readDitaOtConfiguration,
    restorePluginFolder
} from './ditaOtPluginFiles';

export const DEFAULT_REGISTRY_URL = 'https://plugins.dita-ot.org/';
const REGISTRY_FALLBACK_CONTENTS_URL = 'https://api.github.com/repos/dita-ot/registry/contents';

const PLUGIN_ID_PATTERN = /^[A-Za-z0-9][\w.-]*$/;
const PLUGIN_VERSION_PATTERN = /^[A-Za-z0-9][\w.+-]*$/;
const INSTALLED_LINE_PATTERN = /^([A-Za-z0-9][\w.-]*)(?:@v?([A-Za-z0-9][\w.+-]*)|\s+v?(\d[\w.+-]*))?$/;
const HIGHLIGHT_PATTERN = /\[ERROR\]|\[FATAL\]|\bERROR:|\bFATAL:|Exception\b|BUILD FAILED|\[DOT[A-Z]\d{3}[EF]\]/;
const MAX_HIGHLIGHTS = 5;

/** `plugindirs` of DITA-OT's `config/configuration.properties` when it is not set */
const DEFAULT_PLUGIN_DIRS = 'plugins;demo';

/**
 * DITA-OT's own plugins: removing one can break DITA-OT without any check noticing (the
 * DITA 1.3 grammars uninstall without a message), and only DITA-OT's release restores them.
 */
const PROTECTED_PLUGIN_PREFIXES = ['org.dita.', 'org.oasis-open.'];

const pluginXmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    processEntities: false,
    ignoreDeclaration: true,
    ignorePiTags: true,
    isArray: name => name === 'require' || name === 'feature' || name === 'extension-point'
});

export interface InstalledPlugin {
    id: string;
    version?: string;
}

export interface RegistryPlugin {
    id: string;
    description: string;
    /** Versions sorted newest first; empty when only the file listing is known */
    versions: string[];
}

export interface RegistryCatalogResult {
    plugins: RegistryPlugin[];
    source: 'registry' | 'github-fallback';
}

export interface DitaCliResult {
    code: number | null;
    stdout: string;
    stderr: string;
    timedOut?: boolean;
}

export type DitaCliRunner = (args: string[], onOutput?: (chunk: string) => void) => Promise<DitaCliResult>;

export interface PluginInstallResult {
    id: string;
    version?: string;
    success: boolean;
    reason?: string;
    highlights: string[];
}

export interface PluginRequirement {
    /** Plugin ids, any one of which meets the requirement (`plugin="a|b"`) */
    alternatives: string[];
    optional: boolean;
}

/** What the `plugin.xml` of a plugin declares, as far as uninstalling is concerned. */
export interface PluginDescriptor {
    id: string;
    version?: string;
    /** Absolute path of the plugin folder */
    folder: string;
    requires: PluginRequirement[];
    /** Extension points the plugin plugs into (`<feature extension>`) */
    features: string[];
    /** Extension points the plugin defines (`<extension-point id>`) */
    extensionPoints: string[];
}

/** Why an installed plugin cannot be uninstalled from DITA Craft. */
export type UninstallBlock =
    | { kind: 'protected' }
    /** `dita uninstall` removes `<DITA-OT>/plugins/<id>` only; folder is undefined when no plugin.xml was found */
    | { kind: 'not-in-plugins-folder'; folder?: string }
    | { kind: 'required'; dependents: string[] };

export interface UninstallCandidate extends InstalledPlugin {
    /** Undefined when the plugin can be uninstalled */
    block?: UninstallBlock;
}

export interface UninstallOutput {
    success: boolean;
    /** DITA-OT did not find the plugin, so it changed nothing */
    notFound: boolean;
    reason?: string;
    highlights: string[];
}

export interface PluginUninstallResult extends UninstallOutput {
    id: string;
    /** After a failure: the plugin folder was put back and DITA-OT integrated again */
    restored?: boolean;
    /** After a failed rollback: why it failed */
    rollbackError?: string;
    /** After a failed rollback: the folder that keeps the copy of the plugin */
    backupPath?: string;
}

export interface UninstallOptions {
    /** The DITA-OT folder (`DITA_HOME`) */
    ditaOtPath: string;
    /** Where the backup of the plugin folder is made; the system temporary folder by default */
    backupRoot?: string;
    onOutput?: (chunk: string) => void;
}

/** Parse `dita plugins` output: one `id`, `id@version` or `id version` per line. */
export function parseInstalledPlugins(stdout: string): InstalledPlugin[] {
    const plugins = new Map<string, InstalledPlugin>();
    for (const line of stdout.split(/\r?\n/)) {
        const match = line.trim().match(INSTALLED_LINE_PATTERN);
        if (match) {
            const id = match[1];
            const version = match[2] ?? match[3];
            const existing = plugins.get(id);
            // Prefer keeping an entry that has explicit version information.
            if (!existing || (!existing.version && version)) {
                plugins.set(id, version ? { id, version } : { id });
            }
        }
    }
    return [...plugins.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function isValidPluginId(id: string): boolean {
    return PLUGIN_ID_PATTERN.test(id);
}

export function isValidPluginVersion(version: string): boolean {
    return PLUGIN_VERSION_PATTERN.test(version);
}

/** Build the arguments for `dita install <id>` or `dita install <id>@<version>`. */
export function buildInstallArgs(pluginId: string, version?: string): string[] {
    if (!isValidPluginId(pluginId)) {
        throw new Error(`Invalid plugin id: ${pluginId}`);
    }
    if (version !== undefined && !isValidPluginVersion(version)) {
        throw new Error(`Invalid plugin version: ${version}`);
    }
    return ['install', version ? `${pluginId}@${version}` : pluginId];
}

/**
 * Build a catalog from registry JSON. Supports `_all.json` (an object whose values are
 * arrays of version records) as well as a flat array of records. Each record has
 * `name`, `vers` and optional `description`.
 */
export function buildRegistryCatalog(payload: unknown): RegistryPlugin[] {
    const records: unknown[] = [];
    if (Array.isArray(payload)) {
        records.push(...payload);
    } else if (payload && typeof payload === 'object') {
        for (const value of Object.values(payload)) {
            if (Array.isArray(value)) {
                records.push(...value);
            }
        }
    }

    const byId = new Map<string, { description: string; versions: Set<string> }>();
    for (const record of records) {
        if (!record || typeof record !== 'object') {
            continue;
        }
        const { name, vers, description } = record as Record<string, unknown>;
        if (typeof name !== 'string' || !isValidPluginId(name)) {
            continue;
        }
        const entry = byId.get(name) ?? { description: '', versions: new Set<string>() };
        if (!entry.description && typeof description === 'string') {
            entry.description = description;
        }
        if (typeof vers === 'string' && isValidPluginVersion(vers)) {
            entry.versions.add(vers);
        }
        byId.set(name, entry);
    }

    return [...byId.entries()]
        .map(([id, entry]) => ({
            id,
            description: entry.description,
            versions: [...entry.versions].sort((a, b) => compareVersionStrings(b, a))
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
}

/** Minimal catalog from the registry file listing (ids only, no version data). */
export function buildCatalogFromFileNames(names: string[]): RegistryPlugin[] {
    return names
        .filter(name => name.endsWith('.json') && !name.startsWith('_'))
        .map(name => name.slice(0, -'.json'.length))
        .filter(isValidPluginId)
        .sort((a, b) => a.localeCompare(b))
        .map(id => ({ id, description: '', versions: [] }));
}

/** Resolve the registry base URL, falling back to the default when the setting is not a valid http(s) URL. */
export function resolveRegistryBaseUrl(configured: string): string {
    try {
        const url = new URL(configured || DEFAULT_REGISTRY_URL);
        if (url.protocol !== 'https:') {
            return DEFAULT_REGISTRY_URL;
        }
        return url.href.endsWith('/') ? url.href : `${url.href}/`;
    } catch {
        return DEFAULT_REGISTRY_URL;
    }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json', 'User-Agent': 'ditacraft' }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Load the plugin catalog from the registry (`_all.json`). If that fails, fall back to
 * the file listing of the `dita-ot/registry` GitHub repository.
 */
export async function fetchRegistryCatalog(registryUrl: string, timeoutMs = 10000): Promise<RegistryCatalogResult> {
    const base = resolveRegistryBaseUrl(registryUrl);
    try {
        const plugins = buildRegistryCatalog(await fetchJson(new URL('_all.json', base).href, timeoutMs));
        if (plugins.length === 0) {
            throw new Error('registry catalog is empty');
        }
        return { plugins, source: 'registry' };
    } catch (registryError: unknown) {
        try {
            const listing = await fetchJson(REGISTRY_FALLBACK_CONTENTS_URL, timeoutMs);
            const names = Array.isArray(listing)
                ? listing.map(item => (item && typeof item === 'object' ? (item as { name?: unknown }).name : undefined))
                    .filter((name): name is string => typeof name === 'string')
                : [];
            const plugins = buildCatalogFromFileNames(names);
            if (plugins.length === 0) {
                throw new Error('no plugins listed');
            }
            return { plugins, source: 'github-fallback' };
        } catch (fallbackError: unknown) {
            throw new Error(
                `Could not load the plugin registry (${errorText(registryError)}; fallback: ${errorText(fallbackError)})`
            );
        }
    }
}

/** Run `dita plugins` and parse the result. */
export async function listInstalledPlugins(run: DitaCliRunner): Promise<InstalledPlugin[]> {
    const result = await run(['plugins']);
    if (result.code !== 0) {
        throw new Error(`'dita plugins' failed: ${lastLine(result.stderr) || `exit code ${result.code}`}`);
    }
    return parseInstalledPlugins(result.stdout);
}

/** Summarise a `dita install` run: success status, a short reason and log highlights. */
export function parseInstallOutput(result: DitaCliResult): { success: boolean; reason?: string; highlights: string[] } {
    const combined = `${result.stdout}\n${result.stderr}`;
    const highlights = collectHighlights(combined);
    if (result.timedOut) {
        return { success: false, reason: 'timed out', highlights };
    }
    if (result.code !== 0 || /BUILD FAILED/.test(combined)) {
        return {
            success: false,
            reason: highlights[0] ?? (lastLine(result.stderr) || `exit code ${result.code}`),
            highlights
        };
    }
    return { success: true, highlights };
}

/** Install a plugin via `dita install`, optionally pinned to a version. */
export async function installPlugin(
    run: DitaCliRunner,
    pluginId: string,
    version?: string,
    onOutput?: (chunk: string) => void
): Promise<PluginInstallResult> {
    const args = buildInstallArgs(pluginId, version);
    const result = await run(args, onOutput);
    return { id: pluginId, version, ...parseInstallOutput(result) };
}

/** Read a plugin's `plugin.xml`; undefined when it is not a plugin descriptor with a valid id. */
export function parsePluginDescriptor(xml: string, folder: string): PluginDescriptor | undefined {
    let root: unknown;
    try {
        root = (pluginXmlParser.parse(xml) as { plugin?: unknown }).plugin;
    } catch {
        return undefined;
    }
    if (!root || typeof root !== 'object') {
        return undefined;
    }
    const plugin = root as Record<string, unknown>;
    if (typeof plugin.id !== 'string' || !isValidPluginId(plugin.id)) {
        return undefined;
    }
    const records = (key: string): Record<string, unknown>[] =>
        Array.isArray(plugin[key])
            ? (plugin[key] as unknown[]).filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
            : [];
    const strings = (values: unknown[]): string[] =>
        [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim() !== '').map(value => value.trim()))];

    return {
        id: plugin.id,
        version: typeof plugin.version === 'string' ? plugin.version : undefined,
        folder,
        requires: records('require')
            .filter(require => typeof require.plugin === 'string')
            .map(require => ({
                alternatives: strings(String(require.plugin).split('|')),
                optional: require.importance === 'optional'
            }))
            .filter(requirement => requirement.alternatives.length > 0),
        features: strings(records('feature').map(feature => feature.extension)),
        extensionPoints: strings(records('extension-point').map(point => point.id))
    };
}

/**
 * The plugin folders of DITA-OT's `config/configuration.properties` (`plugindirs`,
 * separated by `;`, relative to the DITA-OT folder or absolute), as written there.
 */
export function parsePluginDirs(properties: string): string[] {
    const value = readPropertyValue(properties, 'plugindirs') ?? DEFAULT_PLUGIN_DIRS;
    return value.split(';').map(dir => dir.trim()).filter(Boolean);
}

/** The descriptors of the plugins in every plugin folder of a DITA-OT installation. */
export function readPluginDescriptors(ditaOtPath: string): PluginDescriptor[] {
    const dirs = [...new Set(parsePluginDirs(readDitaOtConfiguration(ditaOtPath)).map(dir => path.resolve(ditaOtPath, dir)))];
    return listPluginXmlFiles(dirs)
        .map(({ folder, xml }) => parsePluginDescriptor(xml, folder))
        .filter((descriptor): descriptor is PluginDescriptor => descriptor !== undefined);
}

export function isProtectedPlugin(id: string): boolean {
    return PROTECTED_PLUGIN_PREFIXES.some(prefix => id.startsWith(prefix));
}

/**
 * The plugins that DITA-OT could no longer integrate without the target, sorted: those that
 * require it (with no other installed alternative, unless the requirement is optional), and
 * those that plug into one of its extension points.
 */
export function findDependents(targetId: string, descriptors: PluginDescriptor[]): string[] {
    const installed = new Set(descriptors.map(descriptor => descriptor.id));
    const targetPoints = new Set(
        descriptors.filter(descriptor => descriptor.id === targetId).flatMap(descriptor => descriptor.extensionPoints)
    );
    const dependents = descriptors.filter(descriptor =>
        descriptor.id !== targetId && (
            descriptor.requires.some(requirement =>
                !requirement.optional
                && requirement.alternatives.includes(targetId)
                && !requirement.alternatives.some(id => id !== targetId && installed.has(id)))
            || descriptor.features.some(feature => targetPoints.has(feature))
        ));
    return [...new Set(dependents.map(descriptor => descriptor.id))].sort((a, b) => a.localeCompare(b));
}

/**
 * Says, for each installed plugin, whether DITA Craft lets the user uninstall it: not one of
 * DITA-OT's own plugins, in `<DITA-OT>/plugins/<id>` (the only folder `dita uninstall` removes),
 * and needed by no other plugin.
 */
export function classifyForUninstall(
    installed: InstalledPlugin[],
    descriptors: PluginDescriptor[],
    ditaOtPath: string
): UninstallCandidate[] {
    return installed.map(plugin => {
        if (isProtectedPlugin(plugin.id)) {
            return { ...plugin, block: { kind: 'protected' } };
        }
        const own = descriptors.filter(descriptor => descriptor.id === plugin.id);
        const expected = path.join(ditaOtPath, 'plugins', plugin.id);
        if (!own.some(descriptor => samePath(descriptor.folder, expected))) {
            return { ...plugin, block: { kind: 'not-in-plugins-folder', folder: own[0]?.folder } };
        }
        const dependents = findDependents(plugin.id, descriptors);
        return dependents.length > 0 ? { ...plugin, block: { kind: 'required', dependents } } : { ...plugin };
    });
}

/** The reason shown for a plugin that cannot be uninstalled. */
export function describeUninstallBlock(block: UninstallBlock): string {
    switch (block.kind) {
        case 'protected':
            return 'Part of DITA-OT';
        case 'not-in-plugins-folder':
            return block.folder
                ? `In ${block.folder}: not removed by dita uninstall`
                : 'Not found in the plugins folder of DITA-OT';
        case 'required':
            return `Required by ${block.dependents.join(', ')}`;
    }
}

/** Build the arguments for `dita uninstall <id>`. */
export function buildUninstallArgs(pluginId: string): string[] {
    if (!isValidPluginId(pluginId)) {
        throw new Error(`Invalid plugin id: ${pluginId}`);
    }
    return ['uninstall', pluginId];
}

/**
 * Summarise a `dita uninstall` run. DITA-OT prints `Removed <id>` and exits with 0 on success;
 * a plugin it does not find is reported as `Error: Plug-in <id> not found`, and changes nothing.
 */
export function parseUninstallOutput(result: DitaCliResult, pluginId: string): UninstallOutput {
    const combined = `${result.stdout}\n${result.stderr}`;
    const highlights = collectHighlights(combined);
    if (result.timedOut) {
        return { success: false, notFound: false, reason: 'timed out', highlights };
    }
    const lines = combined.split(/\r?\n/).map(line => line.trim());
    if (result.code === 0 && lines.includes(`Removed ${pluginId}`)) {
        return { success: true, notFound: false, highlights };
    }
    const errorLine = lines.find(line => line.startsWith('Error:'));
    const reason = errorLine
        ? errorLine.replace(/^Error:\s*/, '').replace(/java\.lang\.\w+(?:Exception|Error):\s*/g, '')
        : highlights[0] ?? (lastLine(result.stderr) || (result.code === 0 ? 'DITA-OT did not report the removal' : `exit code ${result.code}`));
    return {
        success: false,
        notFound: lines.includes(`Error: Plug-in ${pluginId} not found`),
        reason,
        highlights
    };
}

/**
 * Uninstall a plugin with `dita uninstall`, which removes the plugin folder first and integrates
 * DITA-OT after: when the integration fails, the folder is gone and DITA-OT is left broken. So
 * the folder is backed up first, and put back after a failure, with DITA-OT integrated again
 * (`dita install` without argument). A failed backup throws before anything is removed.
 */
export async function uninstallPlugin(
    run: DitaCliRunner,
    pluginId: string,
    options: UninstallOptions
): Promise<PluginUninstallResult> {
    const args = buildUninstallArgs(pluginId);
    const pluginFolder = path.join(options.ditaOtPath, 'plugins', pluginId);
    const backup = backupPluginFolder(pluginFolder, pluginId, options.backupRoot);

    let output: UninstallOutput;
    try {
        output = parseUninstallOutput(await run(args, options.onOutput), pluginId);
    } catch (error: unknown) {
        output = { success: false, notFound: false, reason: errorText(error), highlights: [] };
    }
    if (output.success || output.notFound) {
        discardPluginBackup(backup);
        return { id: pluginId, ...output };
    }

    let integration: DitaCliResult;
    try {
        restorePluginFolder(backup, pluginFolder);
        integration = await run(['install'], options.onOutput);
    } catch (error: unknown) {
        return { id: pluginId, ...output, restored: false, rollbackError: errorText(error), backupPath: backup.path };
    }
    if (integration.code !== 0 || integration.timedOut) {
        const why = integration.timedOut ? 'timed out' : lastLine(integration.stderr) || `exit code ${integration.code}`;
        return {
            id: pluginId,
            ...output,
            restored: false,
            rollbackError: `integrating DITA-OT again failed: ${why}`,
            backupPath: backup.path
        };
    }
    discardPluginBackup(backup);
    return { id: pluginId, ...output, restored: true };
}

function collectHighlights(text: string): string[] {
    const highlights: string[] = [];
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && HIGHLIGHT_PATTERN.test(trimmed) && !highlights.includes(trimmed)) {
            highlights.push(trimmed);
            if (highlights.length >= MAX_HIGHLIGHTS) {
                break;
            }
        }
    }
    return highlights;
}

/** The last value of a key in a Java properties file, unescaped; undefined when the key is absent. */
function readPropertyValue(properties: string, key: string): string | undefined {
    const lines = properties.split(/\r?\n/);
    let value: string | undefined;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/^\s+/, '');
        if (!line || line.startsWith('#') || line.startsWith('!')) {
            continue;
        }
        // A line ending with an odd number of backslashes continues on the next one.
        while (/(?:^|[^\\])(?:\\\\)*\\$/.test(line) && i + 1 < lines.length) {
            line = line.slice(0, -1) + lines[++i].replace(/^\s+/, '');
        }
        const match = line.match(/^((?:\\.|[^\\=:\s])+)\s*[=:\s]?\s*(.*)$/);
        if (match && unescapeProperty(match[1]) === key) {
            value = unescapeProperty(match[2]).trim();
        }
    }
    return value;
}

function unescapeProperty(text: string): string {
    const controls: Record<string, string> = { t: '\t', n: '\n', r: '\r', f: '\f' };
    return text.replace(/\\u([0-9a-fA-F]{4})|\\(.)/g, (_match, hex: string | undefined, char: string | undefined) =>
        hex ? String.fromCharCode(parseInt(hex, 16)) : controls[char as string] ?? (char as string));
}

function samePath(a: string, b: string): boolean {
    const normalize = (value: string): string => {
        const resolved = path.resolve(value);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    };
    return normalize(a) === normalize(b);
}

function lastLine(text: string): string {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1] : '';
}

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
