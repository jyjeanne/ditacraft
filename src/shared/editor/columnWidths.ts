/**
 * Table column widths (spec §13.5: "drag column borders → colspec/@colwidth in * units").
 *
 * CALS `@colwidth` (and simple tables' `@relcolwidth` items) are proportional (`2*`, `*`),
 * fixed (`50pt`, `1in`, `2.5cm`, `30mm`, `3pc`/`3pi`, `40px`; a bare number is pixels, as in
 * the preview), or both (`2*+10pt`). Missing means `1*`.
 *
 * Dragging the border between two columns moves width from one to the other: the other
 * columns and the table keep theirs. Proportional widths are written as whole numbers out of
 * 100 (`30*`, `70*` — a percentage, easy to read): a table whose proportions do not add up to
 * 100 has all of them rewritten that way the first time; after that only the two columns
 * change. Fixed widths keep their unit.
 *
 * Environment-neutral.
 */

export interface ColumnWidth {
    /** Proportional part (stars). */
    stars: number;
    /** Fixed part, in CSS pixels. */
    fixed: number;
    /** The fixed part as written (`10pt`), to keep it when the stars change. */
    fixedText?: string;
    /** Unit of a purely fixed width (to write it back in that unit). */
    unit?: string;
}

const UNIT_PX: Record<string, number> = { px: 1, pt: 96 / 72, pc: 16, pi: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, em: 16 };
const FIXED = /^(\d+(?:\.\d+)?|\.\d+)\s*(px|pt|pc|pi|in|cm|mm|em)?$/i;
const STAR = /^(\d+(?:\.\d+)?|\.\d+)?\s*\*$/;

/** A length (`300`, `300px`, `2.5in`, `72pt`…: a bare number is pixels): its CSS pixels and unit, or undefined. */
export function parseLength(value: string | undefined): { px: number; unit: string; bare: boolean } | undefined {
    const m = FIXED.exec((value ?? '').trim());
    if (!m || Number(m[1]) <= 0) {
        return undefined;
    }
    const unit = (m[2] ?? 'px').toLowerCase();
    return { px: Number(m[1]) * UNIT_PX[unit], unit, bare: m[2] === undefined };
}

/** `px` CSS pixels written in `unit` (whole pixels; two decimals otherwise), as `like` was written (a bare number stays bare). */
export function formatLength(px: number, unit: string, bare: boolean): string {
    if (unit === 'px') {
        return `${Math.max(1, Math.round(px))}${bare ? '' : 'px'}`;
    }
    return `${num(px / UNIT_PX[unit])}${unit}`;
}

/** A `@colwidth` value; unreadable or missing values count as `1*`. */
export function parseColumnWidth(raw: string | undefined): ColumnWidth {
    const value = (raw ?? '').trim();
    if (value === '') {
        return { stars: 1, fixed: 0 };
    }
    let stars = 0;
    let fixed = 0;
    let fixedText: string | undefined;
    let unit: string | undefined;
    for (const part of value.split('+').map((p) => p.trim())) {
        const star = STAR.exec(part);
        const length = FIXED.exec(part);
        if (star) {
            stars += star[1] === undefined ? 1 : Number(star[1]);
        } else if (length) {
            unit = (length[2] ?? 'px').toLowerCase();
            fixed += Number(length[1]) * UNIT_PX[unit];
            fixedText = part;
        } else {
            return { stars: 1, fixed: 0 };
        }
    }
    return stars > 0 ? { stars, fixed, fixedText } : { stars: 0, fixed, unit, fixedText };
}

/** Pixel width of each column in a table `tableWidth` wide. */
export function columnPixels(widths: ColumnWidth[], tableWidth: number): number[] {
    const fixed = widths.reduce((s, w) => s + w.fixed, 0);
    const stars = widths.reduce((s, w) => s + w.stars, 0);
    const perStar = stars > 0 ? Math.max(0, tableWidth - fixed) / stars : 0;
    return widths.map((w) => w.fixed + w.stars * perStar);
}

/**
 * CSS widths for a table's columns, as the preview renders them: proportional columns as
 * percentages of the proportional total, fixed ones in pixels, mixed ones left to the browser
 * (''). Undefined when no column has a width of its own (the browser lays out).
 */
export function cssColumnWidths(raws: (string | undefined)[]): string[] | undefined {
    if (raws.length === 0 || raws.every((r) => (r ?? '').trim() === '')) {
        return undefined;
    }
    const widths = raws.map(parseColumnWidth);
    const starTotal = widths.reduce((s, w) => s + (w.fixed === 0 ? w.stars : 0), 0);
    return widths.map((w) => {
        if (w.fixed === 0 && starTotal > 0) {
            return `${((w.stars / starTotal) * 100).toFixed(2)}%`;
        }
        return w.stars === 0 ? `${Math.round(w.fixed * 100) / 100}px` : '';
    });
}

/** A tgroup's CSS column widths: one per column (`cols`), from its colspecs' `@colwidth` in order. */
export function tgroupWidths(cols: number, colwidths: (string | undefined)[]): string[] | undefined {
    const raws = Array.from({ length: Math.max(cols, colwidths.length) }, (_, i) => colwidths[i]);
    return cssColumnWidths(raws);
}

function num(value: number): string {
    return String(Math.round(value * 100) / 100);
}

/** Whole numbers out of 100, proportional to `values`, adding up to exactly 100. */
function percentages(values: number[]): number[] {
    const total = values.reduce((s, v) => s + v, 0) || 1;
    const raw = values.map((v) => (v / total) * 100);
    const out = raw.map((v) => Math.max(1, Math.floor(v)));
    let rest = 100 - out.reduce((s, v) => s + v, 0);
    // Largest remainders first.
    const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
    for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) {
        out[order[k][1]]++;
    }
    for (let i = out.length - 1; rest < 0 && i >= 0; i--) {
        if (out[i] > 1) {
            out[i]--;
            rest++;
        }
    }
    return out;
}

/**
 * The `@colwidth` values after dragging the border on the right of column `left` (0-based) by
 * `delta` pixels, in a table `tableWidth` wide; each column keeps at least `minPx`. Unchanged
 * columns keep their value as written (undefined: none). Undefined when nothing can move.
 */
export function resizedColumnWidths(raws: (string | undefined)[], left: number, delta: number, tableWidth: number, minPx = 24): (string | undefined)[] | undefined {
    const right = left + 1;
    if (left < 0 || right >= raws.length || tableWidth <= 0) {
        return undefined;
    }
    const widths = raws.map(parseColumnWidth);
    const px = columnPixels(widths, tableWidth);
    const pair = px[left] + px[right];
    const a = Math.min(Math.max(px[left] + delta, minPx), pair - minPx);
    if (pair < 2 * minPx || Math.abs(a - px[left]) < 0.5) {
        return undefined;
    }
    const b = pair - a;

    if (widths.every((w) => w.fixed === 0)) {
        // Proportional only: whole numbers out of 100.
        const total = widths.reduce((s, w) => s + w.stars, 0);
        const exact = Math.abs(total - 100) < 0.01 && widths.every((w) => Number.isInteger(w.stars));
        const stars = exact ? widths.map((w) => w.stars) : percentages(px);
        const sum = stars[left] + stars[right];
        let sa = Math.round((a / pair) * sum);
        sa = Math.min(Math.max(sa, 1), sum - 1);
        stars[left] = sa;
        stars[right] = sum - sa;
        return stars.map((s, i) => (exact && i !== left && i !== right ? raws[i] : `${s}*`));
    }

    // Fixed or mixed widths: each of the two columns keeps its kind and unit.
    const stars = widths.reduce((s, w) => s + w.stars, 0);
    const fixed = widths.reduce((s, w) => s + w.fixed, 0);
    const perStar = stars > 0 ? Math.max(0, tableWidth - fixed) / stars : 0;
    const write = (w: ColumnWidth, target: number): string => {
        if (w.stars === 0) {
            const unit = w.unit ?? 'px';
            return `${num(target / UNIT_PX[unit])}${unit === 'px' && !/px$/i.test(w.fixedText ?? '') ? '' : unit}`;
        }
        const s = perStar > 0 ? Math.max(0.1, (target - w.fixed) / perStar) : w.stars;
        return w.fixedText ? `${num(s)}*+${w.fixedText}` : `${num(s)}*`;
    };
    const out = [...raws];
    out[left] = write(widths[left], a);
    out[right] = write(widths[right], b);
    return out;
}
