/**
 * Build-time compilation of the bundled OASIS grammars: dtds/** → out/grammars/**.
 *
 * Entry point for scripts/compile-grammars.js (which bundles this file with esbuild and
 * runs it). Writes one JSON file per DITA shell plus index.json, and skips the work when
 * the fingerprint of the compiler and every file under dtds/ is unchanged.
 *
 * Node-only.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { discoverShells } from './catalogShells';
import { compileGrammar } from './compiler';
import { readDtdGrammar } from './typesxmlAdapter';
import { COMPILER_VERSION, GRAMMAR_FORMAT, type GrammarIndex, type GrammarIndexEntry } from './types';

export interface BuildOptions {
    /** The extension's dtds/ folder. */
    dtdsDir: string;
    /** Output folder (out/grammars). */
    outDir: string;
    /** Extra fingerprint input, e.g. the hash of the bundled compiler. */
    salt?: string;
    force?: boolean;
}

export interface BuildResult {
    skipped: boolean;
    compiled: GrammarIndexEntry[];
    failures: { shell: string; error: string }[];
    elapsedMs: number;
}

/** DITA version tree of a bundled shell, from its location under dtds/. */
export function bundledVersionOf(dtdsDir: string, shellPath: string): '1.2' | '1.3' | '2.0' {
    const rel = path.relative(dtdsDir, shellPath).split(path.sep).join('/');
    if (rel.startsWith('dita1.2/')) {
        return '1.2';
    }
    if (rel.startsWith('dita2.0/')) {
        return '2.0';
    }
    return '1.3';
}

/** The catalog a bundled shell must be compiled through (its own version tree). */
export function bundledCatalogFor(dtdsDir: string, version: '1.2' | '1.3' | '2.0'): string {
    switch (version) {
        case '1.2': return path.join(dtdsDir, 'dita1.2', 'catalog.xml');
        case '2.0': return path.join(dtdsDir, 'dita2.0', 'catalog.xml');
        default: return path.join(dtdsDir, 'catalog.xml');
    }
}

function listFiles(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listFiles(full, out);
        } else {
            out.push(full);
        }
    }
    return out;
}

function fingerprint(dtdsDir: string, salt: string): string {
    const hash = crypto.createHash('sha1').update(COMPILER_VERSION).update(salt);
    for (const file of listFiles(dtdsDir).sort()) {
        const st = fs.statSync(file);
        hash.update(`${path.relative(dtdsDir, file)}:${st.size}:${st.mtimeMs}\n`);
    }
    return hash.digest('hex');
}

export function buildBundledGrammars(options: BuildOptions): BuildResult {
    const started = Date.now();
    const { dtdsDir, outDir } = options;
    const print = fingerprint(dtdsDir, options.salt ?? '');
    const indexPath = path.join(outDir, 'index.json');

    if (!options.force && fs.existsSync(indexPath)) {
        try {
            const previous = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as GrammarIndex;
            if (previous.fingerprint === print && previous.format === GRAMMAR_FORMAT) {
                return { skipped: true, compiled: previous.grammars, failures: [], elapsedMs: Date.now() - started };
            }
        } catch {
            // Unreadable index: rebuild.
        }
    }

    const shells = discoverShells(path.join(dtdsDir, 'catalog.xml'));
    const compiled: GrammarIndexEntry[] = [];
    const failures: BuildResult['failures'] = [];
    const usedIds = new Set<string>();

    // Remove previous outputs file by file: deleting the folder itself fails on Windows
    // whenever a process (a terminal, an indexer) has it open.
    if (fs.existsSync(outDir)) {
        for (const file of listFiles(outDir)) {
            if (file.endsWith('.json')) {
                fs.rmSync(file, { force: true });
            }
        }
    }
    fs.mkdirSync(outDir, { recursive: true });

    for (const shell of shells) {
        const version = bundledVersionOf(dtdsDir, shell.path);
        let id = `dita-${version}/${path.basename(shell.path, '.dtd')}`;
        for (let n = 2; usedIds.has(id); n++) {
            id = `dita-${version}/${path.basename(shell.path, '.dtd')}-${n}`;
        }
        usedIds.add(id);
        const relShell = path.relative(dtdsDir, shell.path).split(path.sep).join('/');
        try {
            const { raw } = readDtdGrammar(shell.path, bundledCatalogFor(dtdsDir, version));
            const grammar = compileGrammar(raw, { id, ditaVersion: version, shell: relShell, publicIds: shell.publicIds });
            const file = `${id}.json`;
            const target = path.join(outDir, file);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, JSON.stringify(grammar));
            compiled.push({ id, file, ditaVersion: version, shell: relShell, publicIds: grammar.publicIds, roots: grammar.roots });
        } catch (error) {
            failures.push({ shell: relShell, error: error instanceof Error ? error.message : String(error) });
        }
    }

    const index: GrammarIndex = { format: GRAMMAR_FORMAT, compiledWith: COMPILER_VERSION, fingerprint: print, grammars: compiled };
    if (failures.length === 0) {
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 1));
    } else {
        // Leave no index behind so the next build retries instead of trusting a partial set.
        fs.writeFileSync(path.join(outDir, 'index.partial.json'), JSON.stringify(index, null, 1));
    }
    return { skipped: false, compiled, failures, elapsedMs: Date.now() - started };
}
