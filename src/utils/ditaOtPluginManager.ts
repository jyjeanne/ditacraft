/**
 * DITA-OT Plugin Manager
 * Lists installed DITA-OT plugins, reads the online plugin registry, and installs plugins.
 * The DITA-OT CLI is injected as a runner so parsing and argument building stay testable.
 */

import { compareVersionStrings } from './ditaOtInstaller';

export const DEFAULT_REGISTRY_URL = 'https://plugins.dita-ot.org/';
const REGISTRY_FALLBACK_CONTENTS_URL = 'https://api.github.com/repos/dita-ot/registry/contents';

const PLUGIN_ID_PATTERN = /^[A-Za-z0-9][\w.-]*$/;
const PLUGIN_VERSION_PATTERN = /^[A-Za-z0-9][\w.+-]*$/;
const INSTALLED_LINE_PATTERN = /^([A-Za-z0-9][\w.-]*)(?:@v?([A-Za-z0-9][\w.+-]*)|\s+v?(\d[\w.+-]*))?$/;
const HIGHLIGHT_PATTERN = /\[ERROR\]|\[FATAL\]|\bERROR:|\bFATAL:|Exception\b|BUILD FAILED|\[DOT[A-Z]\d{3}[EF]\]/;
const MAX_HIGHLIGHTS = 5;

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
    const highlights: string[] = [];
    for (const line of combined.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && HIGHLIGHT_PATTERN.test(trimmed) && !highlights.includes(trimmed)) {
            highlights.push(trimmed);
            if (highlights.length >= MAX_HIGHLIGHTS) {
                break;
            }
        }
    }
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

function lastLine(text: string): string {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.length > 0 ? lines[lines.length - 1] : '';
}

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
