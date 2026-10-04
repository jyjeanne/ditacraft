/**
 * File path helpers shared by the visual preview and the visual editor hosts (no `vscode`
 * import).
 */

import * as fs from 'fs';
import * as path from 'path';

/** Same file path (case-insensitive where the file system usually is). */
export function samePath(a: string, b: string): boolean {
    const na = path.normalize(a);
    const nb = path.normalize(b);
    return process.platform === 'win32' || process.platform === 'darwin' ? na.toLowerCase() === nb.toLowerCase() : na === nb;
}

export function isInside(child: string, parent: string): boolean {
    const rel = path.relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Canonical path (symbolic links resolved); the resolved path when the file does not exist. */
export async function realPath(file: string): Promise<string> {
    try {
        return await fs.promises.realpath(file);
    } catch {
        return path.resolve(file);
    }
}

export function realPathSync(file: string): string {
    try {
        return fs.realpathSync(file);
    } catch {
        return path.resolve(file);
    }
}
