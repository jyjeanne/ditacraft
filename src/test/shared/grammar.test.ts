/**
 * Grammar Compiler Test Suite (visual preview, spec §4 and §13.2).
 *
 * Compiles every DTD shell bundled in dtds/ through typesxml, checks the placement
 * classification against a hand-checked fixture, instantiates a ProseMirror schema from
 * every grammar (Phase 2 readiness), audits the catalogs, and exercises the runtime cache.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Schema } from 'prosemirror-model';
import { bundledCatalogFor, bundledVersionOf } from '../../shared/grammar/buildGrammars';
import { discoverShells } from '../../shared/grammar/catalogShells';
import { basePlacement, classTokens } from '../../shared/grammar/classTokens';
import { compileGrammar, expandEntities, expandText } from '../../shared/grammar/compiler';
import { compileWithCache } from '../../shared/grammar/grammarCache';
import { pmName } from '../../shared/grammar/pmNames';
import { buildSchemaSpec } from '../../shared/grammar/schemaSpec';
import { readDtdGrammar } from '../../shared/grammar/typesxmlAdapter';
import { elementAttributes, type Grammar } from '../../shared/grammar/types';
import { DTDS_DIR, listFiles } from './helpers';

const compiled = new Map<string, Grammar>();

/** Compile a bundled shell (memoized across tests). */
function compileBundled(relShell: string): Grammar {
    const cached = compiled.get(relShell);
    if (cached) {
        return cached;
    }
    const shellPath = path.join(DTDS_DIR, relShell);
    const version = bundledVersionOf(DTDS_DIR, shellPath);
    const { raw } = readDtdGrammar(shellPath, bundledCatalogFor(DTDS_DIR, version));
    const grammar = compileGrammar(raw, { id: relShell, ditaVersion: version, shell: relShell, publicIds: [] });
    compiled.set(relShell, grammar);
    return grammar;
}

suite('Visual Preview: grammar compiler', function () {
    this.timeout(180000);

    const shells = discoverShells(path.join(DTDS_DIR, 'catalog.xml'));
    const relShells = shells.map((s) => path.relative(DTDS_DIR, s.path).split(path.sep).join('/'));

    suite('bundled shells', () => {
        test('the catalogs declare the expected DITA shells', () => {
            for (const expected of [
                'technicalContent/dtd/concept.dtd', 'technicalContent/dtd/task.dtd', 'technicalContent/dtd/reference.dtd',
                'technicalContent/dtd/topic.dtd', 'technicalContent/dtd/glossentry.dtd', 'technicalContent/dtd/ditabase.dtd',
                'technicalContent/dtd/troubleshooting.dtd', 'technicalContent/dtd/map.dtd', 'bookmap/dtd/bookmap.dtd',
                'base/dtd/basetopic.dtd', 'machineryIndustry/dtd/machineryTask.dtd',
                'dita1.2/technicalContent/dtd/concept.dtd', 'dita2.0/base/basetopic.dtd',
            ]) {
                assert.ok(relShells.includes(expected), `missing shell ${expected}`);
            }
            assert.ok(!relShells.some((s) => /ditaval/i.test(s)), 'DITAVAL is not a document shell');
        });

        test('every bundled shell compiles and yields a valid ProseMirror schema', () => {
            const failures: string[] = [];
            for (const rel of relShells) {
                try {
                    const grammar = compileBundled(rel);
                    assert.ok(Object.keys(grammar.elements).length > 50, `${rel}: too few elements`);
                    const spec = buildSchemaSpec(grammar);
                    new Schema({ topNode: spec.topNode, nodes: spec.nodes });
                } catch (error) {
                    failures.push(`${rel}: ${(error as Error).message.split('\n')[0]}`);
                }
            }
            assert.deepStrictEqual(failures, []);
        });

        test('every non-foreign element has a DITA @class default', () => {
            for (const rel of relShells) {
                const grammar = compileBundled(rel);
                const missing = Object.entries(grammar.elements)
                    .filter(([name, el]) => !el.foreign && !el.class && name !== 'dita')
                    .map(([name]) => name);
                assert.deepStrictEqual(missing, [], `${rel}: elements without @class`);
            }
        });

        test('foreign vocabulary is exactly the prefixed MathML/SVG names', () => {
            const grammar = compileBundled('technicalContent/dtd/concept.dtd');
            const foreign = Object.entries(grammar.elements).filter(([, el]) => el.foreign).map(([name]) => name);
            assert.ok(foreign.length > 200);
            assert.deepStrictEqual(foreign.filter((name) => !/^(m|svg):/.test(name)), []);
        });
    });

    suite('DITA 1.3 concept', () => {
        let grammar: Grammar;
        suiteSetup(() => {
            grammar = compileBundled('technicalContent/dtd/concept.dtd');
        });

        test('content model and attributes of <concept>', () => {
            const concept = grammar.elements.concept;
            assert.strictEqual(concept.class, '- topic/topic concept/concept ');
            assert.strictEqual(concept.content,
                '(title titlealts? (abstract | shortdesc)? prolog? conbody? related_links? concept*)');
            assert.deepStrictEqual(elementAttributes(grammar, 'concept').id, { type: 'ID', default: null, required: true });
            assert.ok(grammar.roots.includes('concept'));
        });

        test('@domains is expanded from &included-domains;', () => {
            const domains = elementAttributes(grammar, 'concept').domains.default ?? '';
            assert.ok(!domains.includes('&'), domains);
            assert.match(domains, /\(topic concept\)/);
            assert.match(domains, /\(topic hazard-d\)/);
        });

        test('enumerated attributes keep their values', () => {
            assert.deepStrictEqual(elementAttributes(grammar, 'table').frame.values,
                ['top', 'bottom', 'topbot', 'all', 'sides', 'none', '-dita-use-conref-target']);
        });

        // Semantic placement comes from the base class token (spec §13.2.5).
        const SEMANTIC: Record<string, 'block' | 'inline' | 'dual'> = {
            ph: 'inline', b: 'inline', i: 'inline', u: 'inline', sup: 'inline', sub: 'inline',
            keyword: 'inline', term: 'inline', codeph: 'inline', uicontrol: 'inline', wintitle: 'inline',
            menucascade: 'inline', filepath: 'inline', cmdname: 'inline', varname: 'inline',
            apiname: 'inline', option: 'inline', parmname: 'inline', cite: 'inline', q: 'inline',
            tm: 'inline', boolean: 'inline', state: 'inline', text: 'inline', 'abbreviated-form': 'inline',
            image: 'dual', xref: 'dual', fn: 'dual', data: 'dual', 'draft-comment': 'dual',
            'required-cleanup': 'dual', indexterm: 'dual', object: 'dual', foreign: 'dual', unknown: 'dual',
            'sort-as': 'dual',
            p: 'block', li: 'block', ul: 'block', ol: 'block', sl: 'block', dl: 'block', dt: 'block',
            dd: 'block', note: 'block', hazardstatement: 'block', section: 'block', example: 'block',
            title: 'block', shortdesc: 'block', abstract: 'block', table: 'block', entry: 'block',
            simpletable: 'block', stentry: 'block', fig: 'block', figgroup: 'block', codeblock: 'block',
            pre: 'block', lines: 'block', lq: 'block', conbody: 'block', prolog: 'block',
            keywords: 'block', 'related-links': 'block', alt: 'block', desc: 'block', concept: 'block',
        };

        test('semantic placement of 60 elements follows their base class', () => {
            const wrong: string[] = [];
            for (const [name, expected] of Object.entries(SEMANTIC)) {
                const el = grammar.elements[name];
                const actual = el ? basePlacement(el.class) : 'missing';
                if (actual !== expected) {
                    wrong.push(`${name}: expected ${expected}, got ${actual}`);
                }
            }
            assert.deepStrictEqual(wrong, []);
        });

        test('schema placement promotes phrases that figgroup allows beside blocks', () => {
            // DITA 1.3 figgroup is an element-only model mixing phrases with dl, figgroup…
            assert.strictEqual(grammar.elements.ph.placement, 'dual');
            assert.strictEqual(grammar.elements.keyword.placement, 'dual');
            assert.strictEqual(grammar.elements.p.placement, 'block');
            assert.strictEqual(grammar.elements.title.placement, 'block');
            assert.strictEqual(grammar.elements.image.placement, 'dual');
        });

        test('block-mixed and inline-only models', () => {
            const expectations: [string, boolean, string][] = [
                ['p', true, '(block | textrun)*'],
                ['li', true, '(block | textrun)*'],
                ['entry', true, '(block | textrun)*'],
                ['title', false, 'inline*'],
                ['ph', false, 'inline*'],
                ['shortdesc', false, 'inline*'],
            ];
            for (const [name, mixed, content] of expectations) {
                assert.strictEqual(grammar.elements[name].mixed, mixed, `${name}.mixed`);
                assert.strictEqual(grammar.elements[name].content, content, `${name}.content`);
            }
        });

        test('element-only models use block variants of dual members', () => {
            assert.match(grammar.elements.fig.content, /image__block/);
            assert.match(grammar.elements.table.content, /^\(\(title\? desc\?\) tgroup\+\)$/);
        });
    });

    suite('catalog audit (spec §4.4)', () => {
        // typesxml's Catalog, loaded the way catalogValidationService.ts loads it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Catalog } = require('typesxml') as { Catalog: new (p: string) => { matchPublic(id: string): string | undefined } };

        const trees: { name: string; catalog: string; inside: (p: string) => boolean; files: () => string[] }[] = [
            {
                name: 'DITA 1.3',
                catalog: path.join(DTDS_DIR, 'catalog.xml'),
                inside: (p) => p.startsWith(DTDS_DIR)
                    && !p.includes(`${path.sep}dita1.2${path.sep}`)
                    && !p.includes(`${path.sep}dita2.0${path.sep}`),
                files: () => ['base', 'bookmap', 'learning', 'machineryIndustry', 'subjectScheme', 'technicalContent', 'xnal']
                    .flatMap((d) => listFiles(path.join(DTDS_DIR, d), /\.(dtd|mod|ent)$/)),
            },
            {
                name: 'DITA 1.2',
                catalog: path.join(DTDS_DIR, 'dita1.2', 'catalog.xml'),
                inside: (p) => p.includes(`${path.sep}dita1.2${path.sep}`),
                files: () => listFiles(path.join(DTDS_DIR, 'dita1.2'), /\.(dtd|mod|ent)$/),
            },
            {
                name: 'DITA 2.0',
                catalog: path.join(DTDS_DIR, 'dita2.0', 'catalog.xml'),
                inside: (p) => p.includes(`${path.sep}dita2.0${path.sep}`),
                files: () => listFiles(path.join(DTDS_DIR, 'dita2.0'), /\.(dtd|mod|ent)$/),
            },
        ];

        for (const tree of trees) {
            test(`every OASIS PUBLIC id referenced in the ${tree.name} modules resolves inside its own tree`, () => {
                const catalog = new Catalog(tree.catalog);
                const problems = new Set<string>();
                for (const file of tree.files()) {
                    const text = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
                    for (const m of text.matchAll(/<!ENTITY\s+%\s+[\w.-]+\s+PUBLIC\s+"([^"]+)"/g)) {
                        const id = m[1];
                        if (!id.startsWith('-//OASIS//')) {
                            continue; // W3C ids inside the self-contained MathML/SVG DTDs resolve by system id
                        }
                        const resolved = catalog.matchPublic(id);
                        if (!resolved || !tree.inside(path.resolve(resolved))) {
                            problems.add(`${id} -> ${resolved ?? 'unmapped'} (from ${path.relative(DTDS_DIR, file)})`);
                        }
                    }
                }
                assert.deepStrictEqual([...problems], []);
            });
        }
    });

    suite('class tokens and entities', () => {
        test('classTokens / basePlacement', () => {
            assert.deepStrictEqual(classTokens('+ topic/note hazard-d/hazardstatement '), ['topic/note', 'hazard-d/hazardstatement']);
            assert.strictEqual(basePlacement('+ topic/ph ui-d/uicontrol '), 'inline');
            assert.strictEqual(basePlacement('- topic/li task/step '), 'block');
            assert.strictEqual(basePlacement('- map/topicref '), 'block');
            assert.strictEqual(basePlacement(undefined), undefined);
        });

        test('pmName mangles hyphens and reserved names', () => {
            assert.strictEqual(pmName('line-through'), 'line_through');
            assert.strictEqual(pmName('text'), 'dita_text');
            assert.strictEqual(pmName('p'), 'p');
        });

        test('expandText resolves character references and one level of entity references', () => {
            assert.strictEqual(expandText('&a;&#65;&#x42;&amp;', (n) => (n === 'a' ? 'x' : null)), 'xAB&');
            assert.strictEqual(expandText('&missing;', () => null), null);
        });

        test('expandEntities expands nested references and drops markup and broken ones', () => {
            const out = expandEntities(new Map([
                ['a', 'x&b;'], ['b', 'y&#x21;'], ['markup', '<ph>m</ph>'], ['broken', '&nowhere;'], ['self', '&self;'],
            ]));
            assert.deepStrictEqual(out, { a: 'xy!', b: 'y!' });
        });
    });

    suite('runtime compile cache (spec §4.3)', () => {
        let dir: string;
        setup(() => {
            dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-grammar-'));
            fs.writeFileSync(path.join(dir, 'shell.dtd'), '<!ENTITY % local SYSTEM "local.mod">\n%local;\n');
            fs.writeFileSync(path.join(dir, 'local.mod'), [
                '<!ELEMENT warranty (title, para*)>',
                '<!ATTLIST warranty id ID #REQUIRED class CDATA "- topic/topic warranty/warranty ">',
                '<!ELEMENT title (#PCDATA)>',
                '<!ATTLIST title class CDATA "- topic/title ">',
                '<!ELEMENT para (#PCDATA)>',
                '<!ATTLIST para class CDATA "- topic/p warranty/para ">',
            ].join('\n'));
        });
        teardown(() => {
            fs.rmSync(dir, { recursive: true, force: true });
        });

        test('reuses the cache until an included module changes', () => {
            const request = { shellPath: path.join(dir, 'shell.dtd'), cacheDir: path.join(dir, 'cache') };
            const first = compileWithCache(request);
            assert.strictEqual(first.fromCache, false);
            assert.ok(first.grammar.roots.includes('warranty'));
            assert.strictEqual(compileWithCache(request).fromCache, true);

            fs.appendFileSync(path.join(dir, 'local.mod'),
                '\n<!ELEMENT clause (#PCDATA)>\n<!ATTLIST clause class CDATA "- topic/p warranty/clause ">\n');
            const third = compileWithCache(request);
            assert.strictEqual(third.fromCache, false);
            assert.strictEqual(third.grammar.elements.clause.class, '- topic/p warranty/clause ');
        });
    });
});
