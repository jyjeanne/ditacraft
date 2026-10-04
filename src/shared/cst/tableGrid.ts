/*
 * Derived from DITA Editor (https://github.com/sageata/dita-editor), file src/cst/table-grid.ts.
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): reformatted; renamed module; cellAt() dropped (editor-only);
 * an entry's @colname now positions it in that column (CALS), as namest/nameend already did.
 */

/**
 * CALS table geometry. A CALS row only lists the <entry> elements that START in that
 * row; columns covered by a morerows span from above, or by a namest/nameend span to
 * the left, have NO <entry>. Each entry's logical rectangle is resolved with the
 * standard occupancy sweep (same idea as HTML table layout), computed PER SECTION
 * because a span never crosses the thead/tbody boundary in valid CALS.
 */

import { attr, childrenNamed, firstChildNamed } from './query';
import type { ElementNode } from './types';

export type SectionName = 'thead' | 'tbody';

export interface GridCell {
    entry: ElementNode;
    section: SectionName;
    /** 0-based row index within the cell's section. */
    row: number;
    /** 1-based inclusive column range the cell occupies. */
    colStart: number;
    colEnd: number;
    /** morerows + 1. */
    rowSpan: number;
}

export interface TableGrid {
    tgroup: ElementNode;
    cols: number;
    numByColname: Map<string, number>;
    colnameByNum: Map<number, string>;
    cells: GridCell[];
    rowsBySection: Record<SectionName, ElementNode[]>;
}

export function computeGrid(tgroup: ElementNode): TableGrid {
    const colspecs = childrenNamed(tgroup, 'colspec');
    const cols = Number(attr(tgroup, 'cols')) || colspecs.length;

    const numByColname = new Map<string, number>();
    const colnameByNum = new Map<number, string>();
    colspecs.forEach((cs, i) => {
        const name = attr(cs, 'colname');
        const num = Number(attr(cs, 'colnum')) || i + 1;
        if (name) {
            numByColname.set(name, num);
            colnameByNum.set(num, name);
        }
    });

    const cells: GridCell[] = [];
    const rowsBySection: Record<SectionName, ElementNode[]> = { thead: [], tbody: [] };

    for (const sectionName of ['thead', 'tbody'] as SectionName[]) {
        const section = firstChildNamed(tgroup, sectionName);
        if (!section) {
            continue;
        }
        const rows = childrenNamed(section, 'row');
        rowsBySection[sectionName] = rows;

        const occupied = new Set<string>(); // `${row},${col}` covered by a span from above/left
        rows.forEach((row, r) => {
            let col = 1;
            for (const entry of childrenNamed(row, 'entry')) {
                while (occupied.has(`${r},${col}`)) {
                    col++;
                }
                const namest = attr(entry, 'namest');
                const nameend = attr(entry, 'nameend');
                let colStart = col;
                let colEnd = col;
                if (namest && nameend && numByColname.has(namest) && numByColname.has(nameend)) {
                    colStart = numByColname.get(namest)!;
                    colEnd = numByColname.get(nameend)!;
                } else {
                    const colname = attr(entry, 'colname');
                    if (colname && numByColname.has(colname)) {
                        colStart = colEnd = numByColname.get(colname)!;
                    }
                }

                const rowSpan = (Number(attr(entry, 'morerows')) || 0) + 1;
                cells.push({ entry, section: sectionName, row: r, colStart, colEnd, rowSpan });

                for (let rr = r; rr < r + rowSpan; rr++) {
                    for (let cc = colStart; cc <= colEnd; cc++) {
                        occupied.add(`${rr},${cc}`);
                    }
                }
                col = colEnd + 1;
            }
        });
    }

    return { tgroup, cols, numByColname, colnameByNum, cells, rowsBySection };
}

export function gridCellFor(grid: TableGrid, entry: ElementNode): GridCell | undefined {
    return grid.cells.find((c) => c.entry === entry);
}

/**
 * True iff the grid is well-formed: no cell over/under-flows the column count or the
 * section rows, and every (row, col) is covered by exactly one cell. Header
 * association is only emitted for valid grids.
 */
export function isGridValid(grid: TableGrid): boolean {
    for (const c of grid.cells) {
        if (c.colStart < 1 || c.colEnd > grid.cols || c.colStart > c.colEnd || c.rowSpan < 1) {
            return false;
        }
    }
    for (const section of ['thead', 'tbody'] as const) {
        const nrows = grid.rowsBySection[section].length;
        const sectionCells = grid.cells.filter((c) => c.section === section);
        for (const c of sectionCells) {
            if (c.row + c.rowSpan > nrows) {
                return false;
            }
        }
        const cover = new Map<string, number>();
        for (const c of sectionCells) {
            for (let r = c.row; r < c.row + c.rowSpan; r++) {
                for (let cc = c.colStart; cc <= c.colEnd; cc++) {
                    cover.set(`${r},${cc}`, (cover.get(`${r},${cc}`) ?? 0) + 1);
                }
            }
        }
        for (let r = 0; r < nrows; r++) {
            for (let cc = 1; cc <= grid.cols; cc++) {
                if (cover.get(`${r},${cc}`) !== 1) {
                    return false;
                }
            }
        }
    }
    return true;
}
