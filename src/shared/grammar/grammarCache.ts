/**
 * Runtime compilation of project grammars (specializations, constraints) with an
 * on-disk cache (spec §4.3).
 *
 * A cache entry is named by sha1(shell path, catalog path) and records every file the
 * parse read — the shell, each .mod/.ent it included, and the catalog chain — with its
 * size and mtime. The entry is reused only while every one of those files is unchanged,
 * so editing any included module or the catalog recompiles the grammar.
 *
 * Node-only.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { catalogChain } from './catalogShells';
import { compileGrammar } from './compiler';
import { readDtdGrammar } from './typesxmlAdapter';
import { COMPILER_VERSION, type Grammar } from './types';

interface Dependency {
    path: string;
    size: number;
    mtimeMs: number;
}

interface CacheEntry {
    compiledWith: string;
    deps: Dependency[];
    grammar: Grammar;
}

export interface CompileRequest {
    shellPath: string;
    catalogPath?: string;
    cacheDir: string;
    publicIds?: string[];
}

export interface CompileOutcome {
    grammar: Grammar;
    fromCache: boolean;
}

export function cacheFileFor(cacheDir: string, shellPath: string, catalogPath?: string): string {
    const key = crypto
        .createHash('sha1')
        .update(path.resolve(shellPath))
        .update('|')
        .update(catalogPath ? path.resolve(catalogPath) : '')
        .digest('hex');
    return path.join(cacheDir, `${key}.json`);
}

function statDependency(file: string): Dependency | undefined {
    try {
        const st = fs.statSync(file);
        return { path: file, size: st.size, mtimeMs: st.mtimeMs };
    } catch {
        return undefined;
    }
}

function isFresh(entry: CacheEntry): boolean {
    if (entry.compiledWith !== COMPILER_VERSION) {
        return false;
    }
    return entry.deps.every((dep) => {
        const now = statDependency(dep.path);
        return now !== undefined && now.size === dep.size && now.mtimeMs === dep.mtimeMs;
    });
}

/** Load a cached grammar for the shell, or compile (and cache) it. Throws if the DTD cannot be parsed. */
export function compileWithCache(request: CompileRequest): CompileOutcome {
    const file = cacheFileFor(request.cacheDir, request.shellPath, request.catalogPath);
    try {
        const entry = JSON.parse(fs.readFileSync(file, 'utf8')) as CacheEntry;
        if (isFresh(entry)) {
            return { grammar: entry.grammar, fromCache: true };
        }
    } catch {
        // Missing or unreadable cache entry: compile.
    }

    const { raw, loadedFiles } = readDtdGrammar(request.shellPath, request.catalogPath);
    const shell = path.resolve(request.shellPath);
    const grammar = compileGrammar(raw, {
        id: `custom/${path.basename(shell, path.extname(shell))}`,
        ditaVersion: 'custom',
        shell,
        publicIds: request.publicIds ?? [],
    });
    const files = new Set(loadedFiles);
    if (request.catalogPath) {
        for (const catalog of catalogChain(request.catalogPath)) {
            files.add(catalog);
        }
    }
    const deps = [...files].sort().map(statDependency).filter((d): d is Dependency => d !== undefined);
    try {
        fs.mkdirSync(request.cacheDir, { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ compiledWith: COMPILER_VERSION, deps, grammar } satisfies CacheEntry));
    } catch {
        // A read-only or full cache folder only costs a recompile next time.
    }
    return { grammar, fromCache: false };
}
