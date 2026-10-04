/**
 * CST Test Suite (visual preview, spec §5 and §12.5).
 *
 * The primary gate: parse → serialize is byte-identical for every DITA file in the
 * corpus. No preview or editing feature is trusted unless this stays green.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { ElementIndex } from '../../shared/cst/elementIndex';
import { parse, ParseError } from '../../shared/cst/parse';
import { doctypeInternalSubset, doctypePublicId, rootElement } from '../../shared/cst/query';
import { serialize } from '../../shared/cst/serialize';
import { computeGrid, isGridValid } from '../../shared/cst/tableGrid';
import type { CstNode, ElementNode } from '../../shared/cst/types';
import { isElement } from '../../shared/cst/types';
import { corpusFiles, MALFORMED_FIXTURES, REPO_ROOT } from './helpers';

function allElements(nodes: CstNode[], out: ElementNode[] = []): ElementNode[] {
    for (const node of nodes) {
        if (isElement(node)) {
            out.push(node);
            allElements(node.children, out);
        }
    }
    return out;
}

suite('Visual Preview: CST', () => {
    suite('round-trip gate', () => {
        const files = corpusFiles();

        test('corpus is present', () => {
            assert.ok(files.length >= 50, `expected at least 50 corpus files, found ${files.length}`);
        });

        test('every corpus file round-trips byte for byte', () => {
            const failures: string[] = [];
            for (const file of files) {
                const source = fs.readFileSync(file, 'utf8');
                try {
                    const out = serialize(parse(source));
                    if (out !== source) {
                        failures.push(`${path.relative(REPO_ROOT, file)}: output differs`);
                    }
                } catch (error) {
                    failures.push(`${path.relative(REPO_ROOT, file)}: ${(error as Error).message}`);
                }
            }
            assert.deepStrictEqual(failures, []);
        });

        test('element ranges point at the right bytes and children tile their parent', () => {
            for (const file of files) {
                const source = fs.readFileSync(file, 'utf8');
                const doc = parse(source);
                for (const el of allElements(doc.children)) {
                    const slice = source.slice(el.range.start, el.range.end);
                    assert.ok(slice.startsWith(`<${el.name}`), `${file}: <${el.name}> range start`);
                    if (el.selfClosing) {
                        assert.ok(slice.endsWith('/>'), `${file}: <${el.name}/> range end`);
                    } else {
                        const close = source.slice(el.closeTagRange!.start, el.closeTagRange!.end);
                        assert.match(close, new RegExp(`^</${el.name.replace(/[.]/g, '\\.')}\\s*>$`), `${file}: </${el.name}> close tag`);
                        assert.strictEqual(el.closeTagRange!.end, el.range.end, `${file}: <${el.name}> range end`);
                    }
                    let cursor = el.openTagRange.end;
                    for (const child of el.children) {
                        assert.strictEqual(child.range.start, cursor, `${file}: gap before a child of <${el.name}>`);
                        cursor = child.range.end;
                    }
                    if (el.closeTagRange) {
                        assert.strictEqual(cursor, el.closeTagRange.start, `${file}: children of <${el.name}> do not reach the end tag`);
                    }
                }
            }
        });
    });

    suite('parser', () => {
        test('keeps the prolog, comments, PIs, CDATA and entities verbatim', () => {
            const src = '<?xml version="1.0" encoding="UTF-8"?>\n'
                + '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd" [\n<!ENTITY prod "AquaFlow">\n]>\n'
                + '<!-- c --><concept id="c"><?pi x?><title>A &amp; B &prod;</title><conbody><p><![CDATA[<x>]]></p></conbody></concept>\n';
            const doc = parse(src);
            assert.strictEqual(serialize(doc), src);
            assert.strictEqual(doctypePublicId(doc), '-//OASIS//DTD DITA Concept//EN');
            assert.match(doctypeInternalSubset(doc) ?? '', /<!ENTITY prod "AquaFlow">/);
            assert.strictEqual(rootElement(doc)?.name, 'concept');
        });

        test('reports malformed XML with an offset', () => {
            const src = '<topic><title>T</title><body><p>open</body></topic>';
            assert.throws(() => parse(src), (error: unknown) => {
                assert.ok(error instanceof ParseError);
                assert.match(error.reason, /mismatched close tag <\/body> for <p>/);
                assert.strictEqual(error.offset, src.indexOf('</body>'));
                return true;
            });
        });

        test('rejects the deliberately malformed fixtures', () => {
            for (const rel of MALFORMED_FIXTURES) {
                const source = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
                assert.throws(() => parse(source), ParseError, rel);
            }
        });

        test('reports an unterminated element at its start tag', () => {
            const src = '<topic><title>T';
            assert.throws(() => parse(src), (error: unknown) => error instanceof ParseError && error.offset === src.indexOf('<title>'));
        });
    });

    suite('ElementIndex', () => {
        const src = '<topic id="t">\n  <title>Hello</title>\n  <body>\n    <p>One <b>two</b></p>\n  </body>\n</topic>';
        const index = new ElementIndex(parse(src));

        test('assigns depth-first ids', () => {
            assert.strictEqual(index.size, 5);
            assert.strictEqual(index.element('e0')?.name, 'topic');
            assert.strictEqual(index.element('e4')?.name, 'b');
            assert.strictEqual(index.openingTagOffset('e3'), src.indexOf('<p>'));
        });

        test('maps an offset to the containing chain, innermost first', () => {
            assert.deepStrictEqual(index.chainAt(src.indexOf('two')), ['e4', 'e3', 'e2', 'e0']);
            assert.deepStrictEqual(index.chainAt(src.indexOf('Hello')), ['e1', 'e0']);
        });

        test('maps inter-element whitespace to the next element', () => {
            assert.deepStrictEqual(index.chainAt(src.indexOf('<p>') - 2), ['e3', 'e2', 'e0']);
        });
    });

    suite('table grid', () => {
        test('resolves namest/nameend, morerows and colname', () => {
            const src = '<tgroup cols="3"><colspec colname="c1"/><colspec colname="c2"/><colspec colname="c3"/><tbody>'
                + '<row><entry namest="c1" nameend="c2">a</entry><entry morerows="1">b</entry></row>'
                + '<row><entry>c</entry><entry colname="c2">d</entry></row></tbody></tgroup>';
            const tgroup = rootElement(parse(src))!;
            const grid = computeGrid(tgroup);
            assert.deepStrictEqual(grid.cells.map((c) => [c.row, c.colStart, c.colEnd, c.rowSpan]), [
                [0, 1, 2, 1], [0, 3, 3, 2], [1, 1, 1, 1], [1, 2, 2, 1],
            ]);
            assert.ok(isGridValid(grid));
        });
    });
});
