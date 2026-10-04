/**
 * Grammar selection for a previewed document (spec §4.5) and loading of compiled
 * grammars: the bundled OASIS ones (out/grammars/, built by scripts/compile-grammars.js)
 * and project grammars reached through `ditacraft.xmlCatalogPath`, compiled at runtime and
 * cached (§4.3).
 *
 * Node-only (file system); no `vscode` import, so it is unit-testable.
 */

import * as fs from 'fs';
import * as path from 'path';
import { doctypeInternalSubset, doctypePublicId, rootElement, attr } from '../shared/cst/query';
import type { Document } from '../shared/cst/types';
import { compileWithCache } from '../shared/grammar/grammarCache';
import type { Grammar, GrammarIndex, GrammarIndexEntry } from '../shared/grammar/types';
import { internalSubsetEntities } from '../shared/render/html';

export interface SelectedGrammar {
    id: string;
    label: string;
    /** The document names no grammar the preview has; the composite grammar stands in. */
    fallback: boolean;
    grammar: Grammar | undefined;
    classOf: (name: string) => string | undefined;
    entity: (name: string) => string | undefined;
}

export interface SelectOptions {
    /** Project catalog (`ditacraft.xmlCatalogPath`), used only in trusted workspaces. */
    externalCatalogPath?: string;
    /** `ditacraft.ditaVersion`: "auto", "1.2", "1.3", "2.0"… */
    ditaVersion?: string;
}

const FALLBACK_ID = 'dita-1.3/ditabase';

/** Root element → shell file name, for documents without a DOCTYPE. */
const ROOT_SHELL: Record<string, string> = {
    topic: 'topic', concept: 'concept', task: 'task', reference: 'reference', glossentry: 'glossentry',
    glossgroup: 'glossgroup', troubleshooting: 'troubleshooting', dita: 'ditabase', map: 'map', bookmap: 'bookmap',
    learningAssessment: 'learningAssessment', learningContent: 'learningContent', learningOverview: 'learningOverview',
    learningPlan: 'learningPlan', learningSummary: 'learningSummary',
};

interface CatalogLike {
    matchPublic(publicId: string): string | undefined;
}

export class GrammarRegistry {
    private index: GrammarIndex | undefined | null;
    private readonly loaded = new Map<string, Grammar>();
    private readonly catalogs = new Map<string, CatalogLike | null>();
    private readonly grammarsDir: string;
    private readonly dtdsDir: string;

    constructor(
        extensionPath: string,
        private readonly cacheDir: string,
        private readonly log: (message: string) => void = () => undefined,
        grammarsDir?: string,
    ) {
        this.grammarsDir = grammarsDir ?? path.join(extensionPath, 'out', 'grammars');
        this.dtdsDir = path.join(extensionPath, 'dtds');
    }

    /** Pick and load the grammar for a parsed document. Never throws. */
    select(doc: Document, options: SelectOptions = {}): SelectedGrammar {
        const subset = internalSubsetEntities(doctypeInternalSubset(doc));
        const publicId = doctypePublicId(doc);
        const root = rootElement(doc);

        let chosen: { id: string; grammar: Grammar | undefined; label: string; fallback: boolean } | undefined;

        if (publicId && options.externalCatalogPath) {
            chosen = this.fromExternalCatalog(publicId, options.externalCatalogPath);
        }
        if (!chosen && publicId) {
            const entry = this.byPublicId(publicId, options.ditaVersion, root ? attr(root, 'ditaarch:DITAArchVersion') : undefined);
            if (entry) {
                chosen = { id: entry.id, grammar: this.load(entry), label: labelOf(entry), fallback: false };
            }
        }
        if (!chosen && !publicId && root) {
            const version = versionFor(undefined, options.ditaVersion, attr(root, 'ditaarch:DITAArchVersion'));
            const shell = ROOT_SHELL[root.name];
            const entry = shell ? this.entries().find((e) => e.id === `dita-${version}/${shell}`)
                ?? this.entries().find((e) => e.id === `dita-1.3/${shell}`) : undefined;
            if (entry) {
                chosen = { id: entry.id, grammar: this.load(entry), label: `${labelOf(entry)} (no DOCTYPE)`, fallback: false };
            }
        }
        if (!chosen) {
            const entry = this.entries().find((e) => e.id === FALLBACK_ID);
            chosen = { id: FALLBACK_ID, grammar: entry ? this.load(entry) : this.compileBundled('technicalContent/dtd/ditabase.dtd'), label: 'DITA 1.3 composite', fallback: true };
        }

        const grammar = chosen.grammar;
        return {
            id: chosen.id,
            label: chosen.label,
            fallback: chosen.fallback,
            grammar,
            classOf: (name) => grammar?.elements[name]?.class,
            entity: (name) => subset.get(name) ?? grammar?.entities[name],
        };
    }

    private entries(): GrammarIndexEntry[] {
        if (this.index === undefined) {
            try {
                this.index = JSON.parse(fs.readFileSync(path.join(this.grammarsDir, 'index.json'), 'utf8')) as GrammarIndex;
            } catch {
                this.log('Visual preview: out/grammars/index.json not found; bundled grammars will be compiled on demand.');
                this.index = null;
            }
        }
        return this.index?.grammars ?? [];
    }

    private byPublicId(publicId: string, setting: string | undefined, archVersion: string | undefined): GrammarIndexEntry | undefined {
        const candidates = this.entries().filter((e) => e.publicIds.includes(publicId));
        if (candidates.length === 0) {
            return undefined;
        }
        const version = versionFor(publicId, setting, archVersion);
        return candidates.find((e) => e.ditaVersion === version)
            ?? candidates.find((e) => e.ditaVersion === '1.3')
            ?? candidates[0];
    }

    private load(entry: GrammarIndexEntry): Grammar | undefined {
        const cached = this.loaded.get(entry.id);
        if (cached) {
            return cached;
        }
        try {
            const grammar = JSON.parse(fs.readFileSync(path.join(this.grammarsDir, entry.file), 'utf8')) as Grammar;
            this.loaded.set(entry.id, grammar);
            return grammar;
        } catch (error) {
            this.log(`Visual preview: cannot read grammar ${entry.file}: ${String(error)}`);
            return this.compileBundled(entry.shell);
        }
    }

    /** Development fallback when out/grammars is missing: compile a bundled shell at runtime. */
    private compileBundled(relShell: string): Grammar | undefined {
        const key = `bundled:${relShell}`;
        const cached = this.loaded.get(key);
        if (cached) {
            return cached;
        }
        const shellPath = path.join(this.dtdsDir, ...relShell.split('/'));
        const catalog = relShell.startsWith('dita1.2/') ? path.join(this.dtdsDir, 'dita1.2', 'catalog.xml')
            : relShell.startsWith('dita2.0/') ? path.join(this.dtdsDir, 'dita2.0', 'catalog.xml')
                : path.join(this.dtdsDir, 'catalog.xml');
        try {
            const { grammar } = compileWithCache({ shellPath, catalogPath: catalog, cacheDir: this.cacheDir });
            this.loaded.set(key, grammar);
            return grammar;
        } catch (error) {
            this.log(`Visual preview: cannot compile ${relShell}: ${String(error)}`);
            return undefined;
        }
    }

    private fromExternalCatalog(publicId: string, catalogPath: string): { id: string; grammar: Grammar | undefined; label: string; fallback: boolean } | undefined {
        const catalog = this.catalog(catalogPath);
        const shell = catalog?.matchPublic(publicId);
        if (!shell || !fs.existsSync(shell)) {
            return undefined;
        }
        // A project catalog that points back at the bundled OASIS shells reuses their grammars.
        const rel = path.relative(this.dtdsDir, shell).split(path.sep).join('/');
        if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
            const entry = this.entries().find((e) => e.shell === rel);
            if (entry) {
                return { id: entry.id, grammar: this.load(entry), label: labelOf(entry), fallback: false };
            }
        }
        const key = `custom:${shell}`;
        let grammar = this.loaded.get(key);
        if (!grammar) {
            try {
                grammar = compileWithCache({ shellPath: shell, catalogPath, cacheDir: this.cacheDir, publicIds: [publicId] }).grammar;
                this.loaded.set(key, grammar);
            } catch (error) {
                this.log(`Visual preview: cannot compile ${shell}: ${String(error)}`);
                return undefined;
            }
        }
        return { id: grammar.id, grammar, label: `${path.basename(shell)} (project)`, fallback: false };
    }

    private catalog(catalogPath: string): CatalogLike | null {
        if (!this.catalogs.has(catalogPath)) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { Catalog } = require('typesxml') as { Catalog: new (p: string) => CatalogLike };
                this.catalogs.set(catalogPath, new Catalog(path.resolve(catalogPath)));
            } catch (error) {
                this.log(`Visual preview: cannot read catalog ${catalogPath}: ${String(error)}`);
                this.catalogs.set(catalogPath, null);
            }
        }
        return this.catalogs.get(catalogPath) ?? null;
    }

    /** Forget loaded project grammars (catalog setting changed). */
    reset(): void {
        for (const key of [...this.loaded.keys()]) {
            if (key.startsWith('custom:')) {
                this.loaded.delete(key);
            }
        }
        this.catalogs.clear();
    }
}

/** DITA version for grammar selection: an explicit version in the PUBLIC id wins, then the setting, then @DITAArchVersion. */
export function versionFor(publicId: string | undefined, setting: string | undefined, archVersion: string | undefined): string {
    const named = publicId ? /DITA (\d\.\d)\b/.exec(publicId)?.[1] : undefined;
    if (named) {
        return named;
    }
    if (setting && setting !== 'auto') {
        return setting === '1.0' || setting === '1.1' ? '1.2' : setting;
    }
    const arch = archVersion?.trim();
    if (arch === '1.2' || arch === '2.0') {
        return arch;
    }
    return '1.3';
}

function labelOf(entry: GrammarIndexEntry): string {
    const shell = path.basename(entry.shell, '.dtd');
    return `DITA ${entry.ditaVersion} ${shell}`;
}
