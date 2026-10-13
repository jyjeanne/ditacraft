#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');

if (process.argv.length < 7) {
    console.error(
        'Usage: node compare-results.js <mapFilesJson> <lspResultsJson> <ditaOtResultsJson> <outJson> <outMd> [--normalization strict|ditaot-known-limits]'
    );
    process.exit(1);
}

const [mapFilesJson, lspJson, ditaOtJson, outJson, outMd, ...extraArgs] = process.argv.slice(2);
let normalization = 'strict';
for (let i = 0; i < extraArgs.length; i++) {
    if (extraArgs[i] === '--normalization' && extraArgs[i + 1]) {
        normalization = extraArgs[i + 1];
        i += 1;
    }
}

const NORMALIZATION_PROFILES = {
    strict: {
        ignoreFamilies: [],
    },
    'ditaot-known-limits': {
        ignoreFamilies: ['scope', 'key-space', 'dotx-build-time', 'resource-availability'],
    },
};

if (!NORMALIZATION_PROFILES[normalization]) {
    console.error(`Unknown normalization profile "${normalization}".`);
    process.exit(1);
}

const mapFiles = JSON.parse(fs.readFileSync(mapFilesJson, 'utf8'));
const lsp = JSON.parse(fs.readFileSync(lspJson, 'utf8'));
const ot = JSON.parse(fs.readFileSync(ditaOtJson, 'utf8'));

const lspMap = new Map(lsp.results.map((r) => [r.file, r]));
const otMap = new Map(ot.results.map((r) => [r.file, r]));
const otCodeRegex = /\[(DOT[AJX]|INDX|PDF[JX]|XEPJ)\d{3}[EFWI]\]/;

function normalizeCode(rawCode) {
    if (!rawCode) return null;
    return String(rawCode).replace(/^\[/, '').replace(/\]$/, '');
}

function classifyFamily(code) {
    if (!code) return 'other';
    if (code === 'DITA-STRUCT-004' || code.startsWith('DITA-SCOPE-') || code === 'DOTJ036W') {
        return 'scope';
    }
    if (code === 'DITA-XREF-001') {
        return 'resource-availability';
    }
    if (
        code === 'DITA-KEY-001'
        || code === 'DITA-KEY-006'
        || code === 'DITA-KEY-007'
        || code === 'DOTX019W'
        || code === 'DOTX030W'
    ) {
        return 'key-space';
    }
    if (code === 'DOTX008E' || code === 'DOTX023W' || code === 'DOTX026W' || code === 'DOTX027W') {
        return 'dotx-build-time';
    }
    if (
        code === 'DITA-XREF-005'
        || code === 'DITA-KEY-008'
        || code === 'DITA-KEY-009'
        || code === 'DITA-KEY-010'
        || code === 'DITA-KEY-012'
    ) {
        return 'dotx-build-time';
    }
    return 'other';
}

function canonicalCode(code) {
    if (!code) return 'NO_CODE';
    if (code === 'DITA-XREF-001' || code === 'DOTX008E') return 'MISSING_RESOURCE';
    if (code === 'DITA-XREF-005') return 'BUILD_TIME_RESOURCE_COLLISION';
    if (code === 'DITA-KEY-001' || code === 'DOTX019W') return 'UNRESOLVED_KEY_REFERENCE';
    if (code === 'DITA-KEY-005' || code === 'DOTJ055E') return 'INVALID_KEY_NAME';
    if (code === 'DITA-KEY-008' || code === 'DOTX023W') return 'CHUNK_NAVTITLE_RETRIEVAL';
    if (code === 'DITA-KEY-009' || code === 'DOTX026W') return 'CHUNK_LINKTEXT_FALLBACK';
    if (code === 'DITA-KEY-010' || code === 'DOTX027W') return 'CHUNK_LINKTEXT_MISSING';
    if (code === 'DITA-KEY-012' || code === 'DOTX061W') return 'CHUNK_TOPIC_FRAGMENT_MISMATCH';
    if (code === 'DITA-SCOPE-004' || code === 'DOTJ036W') return 'OUTSIDE_INPUT_DIRECTORY';
    return code;
}

function toLspIssues(lspResult) {
    if (!lspResult) return [];
    const items = Array.isArray(lspResult.items) ? lspResult.items : [];
    if (items.length > 0) {
        return items.map((item) => ({
            source: 'lsp',
            severity: item.severity === 1 ? 'error' : 'warning',
            code: normalizeCode(item.code),
            canonical: canonicalCode(normalizeCode(item.code)),
            family: classifyFamily(normalizeCode(item.code)),
        }));
    }
    const fallback = [];
    for (let i = 0; i < (lspResult.errors || 0); i++) {
        fallback.push({ source: 'lsp', severity: 'error', code: 'UNKNOWN', canonical: 'UNKNOWN', family: 'other' });
    }
    for (let i = 0; i < (lspResult.warnings || 0); i++) {
        fallback.push({ source: 'lsp', severity: 'warning', code: 'UNKNOWN', canonical: 'UNKNOWN', family: 'other' });
    }
    return fallback;
}

function toDitaOtIssues(otResult) {
    if (!otResult) return [];
    const explicit = Array.isArray(otResult.issues) ? otResult.issues : [];
    if (explicit.length > 0) {
        return explicit.map((issue) => {
            const code = normalizeCode(issue.code);
            return {
                source: 'dita-ot',
                severity: issue.severity === 'error' ? 'error' : 'warning',
                code,
                canonical: canonicalCode(code),
                family: classifyFamily(code),
            };
        });
    }

    const issues = [];
    for (const rawLine of otResult.errors || []) {
        const match = String(rawLine).match(otCodeRegex);
        const code = normalizeCode(match ? match[0] : null);
        issues.push({
            source: 'dita-ot',
            severity: 'error',
            code,
            canonical: canonicalCode(code),
            family: classifyFamily(code),
        });
    }
    for (const rawLine of otResult.warnings || []) {
        const match = String(rawLine).match(otCodeRegex);
        const code = normalizeCode(match ? match[0] : null);
        issues.push({
            source: 'dita-ot',
            severity: 'warning',
            code,
            canonical: canonicalCode(code),
            family: classifyFamily(code),
        });
    }
    return issues;
}

function filterIssues(issues, profileName) {
    const profile = NORMALIZATION_PROFILES[profileName];
    const ignoredFamilies = new Set(profile.ignoreFamilies);
    return issues.filter((issue) => !ignoredFamilies.has(issue.family));
}

function countByCanonical(issues) {
    const counts = new Map();
    for (const issue of issues) {
        counts.set(issue.canonical, (counts.get(issue.canonical) || 0) + 1);
    }
    return counts;
}

function countsToObject(counts) {
    return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function mapsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a.entries()) {
        if (b.get(key) !== value) return false;
    }
    return true;
}

function mergeFamilies(lspIssues, otIssues) {
    const merged = new Set();
    for (const issue of lspIssues) merged.add(issue.family);
    for (const issue of otIssues) merged.add(issue.family);
    return [...merged].sort();
}

const familyMismatchCounts = {
    scope: 0,
    'key-space': 0,
    'dotx-build-time': 0,
    'resource-availability': 0,
    other: 0,
};

const rows = [];
for (const file of mapFiles) {
    const l = lspMap.get(file) || { errors: 0, warnings: 0, codes: [] };
    const o = otMap.get(file) || { errorCount: 0, warningCount: 0, codes: [] };
    const strictMatch = l.errors === o.errorCount && l.warnings === o.warningCount;
    const lspIssues = toLspIssues(l);
    const ditaOtIssues = toDitaOtIssues(o);
    const filteredLspIssues = filterIssues(lspIssues, normalization);
    const filteredOtIssues = filterIssues(ditaOtIssues, normalization);
    const lspComparable = countByCanonical(filteredLspIssues);
    const ditaOtComparable = countByCanonical(filteredOtIssues);
    const normalizedMatch = mapsEqual(lspComparable, ditaOtComparable);
    const families = mergeFamilies(lspIssues, ditaOtIssues);
    if (!strictMatch) {
        for (const family of families) {
            familyMismatchCounts[family] = (familyMismatchCounts[family] || 0) + 1;
        }
    }
    rows.push({
        file,
        lspErrors: l.errors,
        lspWarnings: l.warnings,
        ditaOtErrors: o.errorCount,
        ditaOtWarnings: o.warningCount,
        strictMatch,
        normalizedMatch,
        match: normalization === 'strict' ? strictMatch : normalizedMatch,
        lspCodes: l.codes || [],
        ditaOtCodes: o.codes || [],
        families,
        lspComparable: countsToObject(lspComparable),
        ditaOtComparable: countsToObject(ditaOtComparable),
    });
}

const mismatches = rows.filter((r) => !r.match);
const strictMismatches = rows.filter((r) => !r.strictMatch);
const parity = ((rows.length - mismatches.length) / rows.length) * 100;
const strictParity = ((rows.length - strictMismatches.length) / rows.length) * 100;
const summary = {
    generatedAt: new Date().toISOString(),
    normalization,
    totalFiles: rows.length,
    matchedFiles: rows.length - mismatches.length,
    mismatchedFiles: mismatches.length,
    parityPercent: Number(parity.toFixed(2)),
    strictMatchedFiles: rows.length - strictMismatches.length,
    strictMismatchedFiles: strictMismatches.length,
    strictParityPercent: Number(strictParity.toFixed(2)),
    strictMismatchFamilies: familyMismatchCounts,
};

const report = { summary, mismatches, strictMismatches, rows };
fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

const top = mismatches.slice(0, 25);
const md = [];
md.push('# LSP vs DITA-OT comparison report');
md.push('');
md.push(`- Generated: ${summary.generatedAt}`);
md.push(`- Files compared: ${summary.totalFiles}`);
md.push(`- Normalization profile: ${summary.normalization}`);
md.push(`- Strict parity: ${summary.strictParityPercent}% (${summary.strictMatchedFiles}/${summary.totalFiles})`);
md.push(`- Selected parity: ${summary.parityPercent}% (${summary.matchedFiles}/${summary.totalFiles})`);
md.push('');
md.push('## Strict mismatch family counts');
md.push('');
md.push('| Family | Files affected |');
md.push('|---|---:|');
for (const [family, count] of Object.entries(summary.strictMismatchFamilies)) {
    md.push(`| ${family} | ${count} |`);
}
md.push('');
md.push('## Selected-mode mismatch sample (up to 25)');
md.push('');
md.push('| File | LSP (E/W) | DITA-OT (E/W) |');
md.push('|---|---:|---:|');
for (const m of top) {
    md.push(`| ${m.file.replace(/\\/g, '/')} | ${m.lspErrors}/${m.lspWarnings} | ${m.ditaOtErrors}/${m.ditaOtWarnings} |`);
}
if (top.length === 0) {
    md.push('| _none_ | - | - |');
}

fs.writeFileSync(outMd, md.join('\n'));
console.log(
    `Strict parity ${summary.strictParityPercent}% (${summary.strictMatchedFiles}/${summary.totalFiles}), `
    + `selected parity ${summary.parityPercent}% (${summary.matchedFiles}/${summary.totalFiles})`
);
