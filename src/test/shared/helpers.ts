/**
 * Shared helpers for the environment-neutral test suites under src/test/shared/.
 *
 * These suites need no VS Code host: `npm run test:shared` runs them with plain Mocha,
 * and the VS Code integration runner picks them up too.
 */

import * as fs from 'fs';
import * as path from 'path';
import { compileGrammar } from '../../shared/grammar/compiler';
import { readDtdGrammar } from '../../shared/grammar/typesxmlAdapter';
import type { Grammar } from '../../shared/grammar/types';

/** Repository root (works from out/test/shared/ and from src/test/shared/). */
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const DTDS_DIR = path.join(REPO_ROOT, 'dtds');

/** Every file under `dir` whose name matches `pattern`. */
export function listFiles(dir: string, pattern: RegExp, out: string[] = []): string[] {
    if (!fs.existsSync(dir)) {
        return out;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'out' || entry.name.startsWith('.git')) {
            continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            listFiles(full, pattern, out);
        } else if (pattern.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

let ditabase: Grammar | undefined;

/**
 * The DITA 1.3 composite grammar (every OASIS topic type and domain), compiled from the
 * bundled DTDs once per run. This is the preview's fallback grammar.
 */
export function ditabaseGrammar(): Grammar {
    if (!ditabase) {
        const { raw } = readDtdGrammar(path.join(DTDS_DIR, 'technicalContent', 'dtd', 'ditabase.dtd'), path.join(DTDS_DIR, 'catalog.xml'));
        ditabase = compileGrammar(raw, { id: 'dita-1.3/ditabase', ditaVersion: '1.3', shell: 'technicalContent/dtd/ditabase.dtd', publicIds: [] });
    }
    return ditabase;
}

/** Fixtures that are deliberately not well-formed XML (used by the validation tests). */
export const MALFORMED_FIXTURES = ['src/test/fixtures/invalid-xml.dita'];

function isMalformedFixture(file: string): boolean {
    const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
    return MALFORMED_FIXTURES.includes(rel);
}

/**
 * Well-formed DITA topics and maps checked into the repository, used as the round-trip
 * corpus. Set DITACRAFT_CORPUS to a folder to add an external corpus.
 */
export function corpusFiles(): string[] {
    const roots = ['src/test/fixtures', 'docs/user-guide', 'mcp/.mcp-test-workspace', 'test-minimal'];
    const files: string[] = [];
    for (const root of roots) {
        listFiles(path.join(REPO_ROOT, root), /\.(dita|ditamap|bookmap)$/i, files);
    }
    const external = process.env.DITACRAFT_CORPUS;
    if (external) {
        listFiles(external, /\.(dita|ditamap|bookmap)$/i, files);
    }
    return files.filter((f) => !isMalformedFixture(f)).sort();
}
