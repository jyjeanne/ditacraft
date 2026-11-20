/**
 * DITA-OT Installer
 * Downloads, safely extracts, and verifies DITA-OT release archives.
 * Pure Node.js (no VS Code dependency) so it can be unit tested directly.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as yauzl from 'yauzl';

export const DITA_OT_REPO = 'dita-ot/dita-ot';

/** Used when the GitHub releases API cannot be reached. */
export const FALLBACK_DITA_OT_VERSIONS: readonly string[] = [
    '4.4.2', '4.4.1', '4.4', '4.3.5', '4.3.4', '4.3.3', '4.3.2', '4.3.1', '4.3',
    '4.2.4', '4.2.3', '4.2.2', '4.2.1', '4.2', '4.1.2', '4.1.1', '4.1', '4.0.2', '4.0.1', '4.0'
];

const VERSION_PATTERN = /^\d+\.\d+(\.\d+)?$/;
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;

export interface VersionListResult {
    versions: string[];
    source: 'github' | 'fallback';
}

export interface InstallOptions {
    /** DITA-OT version to install, e.g. "4.4.2" */
    version: string;
    /** Folder in which the `dita-ot-<version>` directory is created */
    targetDir: string;
    /** Timeout for the download request, in milliseconds */
    downloadTimeoutMs: number;
    /** Optional progress callback (message only) */
    onProgress?: (message: string) => void;
    /** Verifies the extracted installation and returns its reported version */
    verify: (installPath: string) => Promise<string | undefined>;
}

export interface InstallResult {
    version: string;
    installPath: string;
}

export function isValidDitaOtVersion(version: string): boolean {
    return VERSION_PATTERN.test(version);
}

/** Numeric comparison of dotted version strings; non-numeric parts compare as 0. */
export function compareVersionStrings(a: string, b: string): number {
    const pa = a.split('.').map(part => parseInt(part, 10) || 0);
    const pb = b.split('.').map(part => parseInt(part, 10) || 0);
    const length = Math.max(pa.length, pb.length);
    for (let i = 0; i < length; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

/**
 * Turn a GitHub releases payload into a sorted (newest first) list of
 * installable DITA-OT versions. Drafts, prereleases and non-version tags are dropped.
 */
export function parseReleaseVersions(releases: unknown): string[] {
    if (!Array.isArray(releases)) {
        return [];
    }
    const versions = new Set<string>();
    for (const release of releases) {
        if (!release || typeof release !== 'object') {
            continue;
        }
        const { tag_name, draft, prerelease } = release as { tag_name?: unknown; draft?: unknown; prerelease?: unknown };
        if (typeof tag_name !== 'string' || draft === true || prerelease === true) {
            continue;
        }
        if (isValidDitaOtVersion(tag_name)) {
            versions.add(tag_name);
        }
    }
    return [...versions].sort((a, b) => compareVersionStrings(b, a));
}

/**
 * Fetch available DITA-OT versions from GitHub releases.
 * Falls back to the static list when the request fails or times out.
 */
export async function fetchDitaOtVersions(timeoutMs = 5000): Promise<VersionListResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`https://api.github.com/repos/${DITA_OT_REPO}/releases?per_page=100`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ditacraft' },
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const versions = parseReleaseVersions(await response.json());
        if (versions.length === 0) {
            throw new Error('no valid releases found');
        }
        return { versions, source: 'github' };
    } catch {
        return { versions: [...FALLBACK_DITA_OT_VERSIONS], source: 'fallback' };
    } finally {
        clearTimeout(timer);
    }
}

export function buildArchiveUrl(version: string): string {
    if (!isValidDitaOtVersion(version)) {
        throw new Error(`Invalid DITA-OT version: ${version}`);
    }
    return `https://github.com/${DITA_OT_REPO}/releases/download/${version}/dita-ot-${version}.zip`;
}

/**
 * Resolve a zip entry name to a path inside `targetRoot`.
 * Rejects absolute paths, drive letters, `..` segments, NUL bytes and anything resolving outside the root.
 */
export function resolveEntryPath(targetRoot: string, entryName: string): string {
    if (entryName.includes('\0')) {
        throw new Error(`Unsafe archive entry: ${JSON.stringify(entryName)}`);
    }
    const normalized = entryName.replace(/\\/g, '/');
    if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
        throw new Error(`Unsafe archive entry (absolute path): ${entryName}`);
    }
    const segments = normalized.split('/').filter(segment => segment !== '' && segment !== '.');
    if (segments.includes('..')) {
        throw new Error(`Unsafe archive entry (path traversal): ${entryName}`);
    }
    const root = path.resolve(targetRoot);
    const resolved = path.resolve(root, ...segments);
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Unsafe archive entry (outside target): ${entryName}`);
    }
    return resolved;
}

/** Checks the zip local-file-header signature. */
export function isZipFile(filePath: string): boolean {
    try {
        const fd = fs.openSync(filePath, 'r');
        try {
            const header = Buffer.alloc(4);
            const bytesRead = fs.readSync(fd, header, 0, 4, 0);
            return bytesRead === 4 && header.equals(ZIP_MAGIC);
        } finally {
            fs.closeSync(fd);
        }
    } catch {
        return false;
    }
}

/**
 * Download a release archive to `destPath`, reporting byte progress.
 * Rejects on HTTP errors, empty bodies, or when `timeoutMs` elapses.
 */
export async function downloadArchive(
    url: string,
    destPath: string,
    timeoutMs: number,
    onProgress?: (message: string) => void
): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ditacraft' } });
        if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
        }
        const total = Number(response.headers.get('content-length')) || 0;
        let received = 0;
        const reader = Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream);
        reader.on('data', (chunk: Buffer) => {
            received += chunk.length;
            if (onProgress && total > 0) {
                onProgress(`Downloading… ${Math.floor((received / total) * 100)}%`);
            }
        });
        await pipeline(reader, fs.createWriteStream(destPath));
        const size = fs.statSync(destPath).size;
        if (size === 0) {
            throw new Error('downloaded file is empty');
        }
    } catch (error: unknown) {
        if (controller.signal.aborted) {
            throw new Error(`timed out after ${Math.round(timeoutMs / 1000)} seconds`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Extract a zip archive into `targetDir`, rejecting entries that escape it or are symlinks.
 * Unix permission bits are restored so `bin/dita` stays executable.
 */
export function extractZipSafely(zipPath: string, targetDir: string): Promise<void> {
    fs.mkdirSync(targetDir, { recursive: true });
    return new Promise((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (openError, zipfile) => {
            if (openError || !zipfile) {
                reject(openError ?? new Error('unable to open archive'));
                return;
            }
            let settled = false;
            const activeStreams: Array<{ destroy(): void }> = [];
            const fail = (error: unknown) => {
                if (settled) {
                    return;
                }
                settled = true;
                for (const stream of activeStreams) {
                    stream.destroy();
                }
                zipfile.close();
                reject(error instanceof Error ? error : new Error(String(error)));
            };
            zipfile.on('error', fail);
            zipfile.on('end', () => {
                if (!settled) {
                    settled = true;
                    resolve();
                }
            });
            zipfile.on('entry', (entry: yauzl.Entry) => {
                try {
                    const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
                    if ((unixMode & S_IFMT) === S_IFLNK) {
                        throw new Error(`Unsafe archive entry (symbolic link): ${entry.fileName}`);
                    }
                    const destPath = resolveEntryPath(targetDir, entry.fileName);

                    if (/\/$/.test(entry.fileName)) {
                        fs.mkdirSync(destPath, { recursive: true });
                        zipfile.readEntry();
                        return;
                    }

                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    zipfile.openReadStream(entry, (streamError, readStream) => {
                        if (streamError || !readStream) {
                            fail(streamError ?? new Error(`cannot read ${entry.fileName}`));
                            return;
                        }
                        const writeStream = fs.createWriteStream(destPath);
                        activeStreams.push(readStream, writeStream);
                        readStream.on('error', fail);
                        writeStream.on('error', fail);
                        writeStream.on('finish', () => {
                            if (process.platform !== 'win32' && (unixMode & 0o777) !== 0) {
                                fs.chmodSync(destPath, unixMode & 0o777);
                            }
                            zipfile.readEntry();
                        });
                        readStream.pipe(writeStream);
                    });
                } catch (error) {
                    fail(error);
                }
            });
            zipfile.readEntry();
        });
    });
}

/** True when `dir` contains `bin/dita` or `bin/dita.bat`/`dita.cmd`. */
export function isDitaOtRoot(dir: string): boolean {
    const bin = path.join(dir, 'bin');
    return ['dita', 'dita.bat', 'dita.cmd'].some(name => fs.existsSync(path.join(bin, name)));
}

/**
 * Locate the DITA-OT root after extraction: either `dir` itself or one of its
 * immediate subdirectories (release archives wrap content in `dita-ot-<version>/`).
 */
export function findDitaOtRoot(dir: string): string | undefined {
    if (isDitaOtRoot(dir)) {
        return dir;
    }
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return undefined;
    }
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const candidate = path.join(dir, entry.name);
            if (isDitaOtRoot(candidate)) {
                return candidate;
            }
        }
    }
    return undefined;
}

/** Creates the directory if needed and checks it is writable. */
export function isWritableDirectory(dir: string): boolean {
    try {
        fs.mkdirSync(dir, { recursive: true });
        fs.accessSync(dir, fs.constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Run `dita --version` against an installation directory.
 * Returns the parsed version, or undefined when the command fails.
 */
export function verifyDitaOtAt(installPath: string): Promise<string | undefined> {
    const binName = process.platform === 'win32' ? 'dita.bat' : 'dita';
    const command = path.join(installPath, 'bin', binName);
    const env = { ...process.env, DITA_HOME: installPath };
    const parse = (stdout: string): string | undefined => stdout.match(/DITA-OT version ([\d.]+)/i)?.[1];
    return new Promise(resolve => {
        const callback = (error: Error | null, stdout: string) => resolve(error ? undefined : parse(stdout));
        if (process.platform === 'win32') {
            execFile('cmd.exe', ['/c', command, '--version'], { env, timeout: 60000 }, (error, stdout) => callback(error, String(stdout)));
        } else {
            execFile(command, ['--version'], { env, timeout: 60000 }, (error, stdout) => callback(error, String(stdout)));
        }
    });
}

/**
 * Download, extract and verify a DITA-OT release into `<targetDir>/dita-ot-<version>`.
 * Extraction happens in a staging folder and is moved into place only after the
 * installation structure is found. A failed verification removes the new folder.
 */
export async function installDitaOt(options: InstallOptions): Promise<InstallResult> {
    const { version, downloadTimeoutMs, onProgress, verify } = options;
    if (!isValidDitaOtVersion(version)) {
        throw new Error(`Invalid DITA-OT version: ${version}`);
    }
    const targetDir = path.resolve(options.targetDir);
    if (!isWritableDirectory(targetDir)) {
        throw new Error(`Installation directory is not writable: ${targetDir}`);
    }
    const installPath = path.join(targetDir, `dita-ot-${version}`);
    if (fs.existsSync(installPath)) {
        throw new Error(`A folder already exists at ${installPath}. Choose another target directory or remove it first.`);
    }

    const stamp = `${process.pid}-${Date.now()}`;
    const privateTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-'));
    const archivePath = path.join(privateTempDir, `dita-ot-${version}.zip`);
    const stagingDir = path.join(targetDir, `.ditacraft-staging-${stamp}`);
    try {
        onProgress?.(`Downloading DITA-OT ${version}…`);
        try {
            await downloadArchive(buildArchiveUrl(version), archivePath, downloadTimeoutMs, onProgress);
        } catch (error) {
            throw new Error(`Failed to download DITA-OT ${version}: ${errorText(error)}`);
        }
        if (!isZipFile(archivePath)) {
            throw new Error(`Failed to download DITA-OT ${version}: archive is corrupted or not a zip file`);
        }

        onProgress?.('Extracting archive…');
        try {
            await extractZipSafely(archivePath, stagingDir);
        } catch (error) {
            throw new Error(`Extraction failed for DITA-OT ${version}: ${errorText(error)}`);
        }

        const root = findDitaOtRoot(stagingDir);
        if (!root) {
            throw new Error(`Extracted archive does not contain a DITA-OT installation (bin/dita not found)`);
        }
        fs.renameSync(root, installPath);

        onProgress?.('Verifying installation…');
        const verifiedVersion = await verify(installPath).catch(() => undefined);
        if (!verifiedVersion) {
            fs.rmSync(installPath, { recursive: true, force: true });
            throw new Error(`DITA-OT installed but verification failed. Please run 'DITA: Configure DITA-OT Path'.`);
        }
        return { version: verifiedVersion, installPath };
    } finally {
        safeRemove(privateTempDir);
        safeRemove(stagingDir);
    }
}

/** Best-effort removal that never masks the primary error from an install step. */
function safeRemove(target: string): void {
    try {
        fs.rmSync(target, { recursive: true, force: true });
    } catch {
        // Leftover temp files are harmless; ignore cleanup failures.
    }
}

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
