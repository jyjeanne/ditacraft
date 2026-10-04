/**
 * Discover DITA DTD shells from OASIS XML catalogs.
 *
 * A shell is a `<public>` entry whose PUBLIC id is a DITA document type
 * ("-//OASIS//DTD DITA …"). DITAVAL is skipped: it is not a topic or map vocabulary.
 *
 * Node-only (reads catalog files).
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CatalogShell {
    /** Absolute path of the .dtd shell. */
    path: string;
    /** Every DITA PUBLIC id that maps to it, across the catalog chain. */
    publicIds: string[];
}

const TAG = /<(public|nextCatalog)\b([^>]*?)\/?>/g;
const ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const SHELL_ID = /^-\/\/OASIS\/\/DTD DITA /;

/** Catalog text with comments removed (they may hold commented-out entries). */
function readCatalog(file: string): string {
    return fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
}

function attributes(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    ATTR.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ATTR.exec(text)) !== null) {
        out[m[1]] = m[2] ?? m[3];
    }
    return out;
}

/** All catalog files reachable from `catalogPath` through nextCatalog, in visit order. */
export function catalogChain(catalogPath: string): string[] {
    const seen: string[] = [];
    const visit = (file: string): void => {
        const abs = path.resolve(file);
        if (seen.includes(abs) || !fs.existsSync(abs)) {
            return;
        }
        seen.push(abs);
        const text = readCatalog(abs);
        TAG.lastIndex = 0;
        let m: RegExpExecArray | null;
        const next: string[] = [];
        while ((m = TAG.exec(text)) !== null) {
            if (m[1] === 'nextCatalog') {
                const target = attributes(m[2]).catalog;
                if (target) {
                    next.push(path.resolve(path.dirname(abs), target));
                }
            }
        }
        next.forEach(visit);
    };
    visit(catalogPath);
    return seen;
}

/** DITA DTD shells declared by `catalogPath` and every catalog it chains to. */
export function discoverShells(catalogPath: string): CatalogShell[] {
    const byPath = new Map<string, Set<string>>();
    for (const file of catalogChain(catalogPath)) {
        const text = readCatalog(file);
        TAG.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = TAG.exec(text)) !== null) {
            if (m[1] !== 'public') {
                continue;
            }
            const a = attributes(m[2]);
            if (!a.publicId || !a.uri || !SHELL_ID.test(a.publicId) || /DITAVAL/i.test(a.publicId)) {
                continue;
            }
            const shell = path.resolve(path.dirname(file), a.uri);
            if (!shell.toLowerCase().endsWith('.dtd') || !fs.existsSync(shell)) {
                continue;
            }
            if (!byPath.has(shell)) {
                byPath.set(shell, new Set());
            }
            byPath.get(shell)!.add(a.publicId);
        }
    }
    return [...byPath.entries()]
        .map(([p, ids]) => ({ path: p, publicIds: [...ids].sort() }))
        .sort((a, b) => a.path.localeCompare(b.path));
}
