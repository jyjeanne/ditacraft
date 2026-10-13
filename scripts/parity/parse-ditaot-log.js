#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');

if (process.argv.length < 5) {
    console.error('Usage: node parse-ditaot-log.js <logFile> <mapFilesJson> <outputJson>');
    process.exit(1);
}

const [logFile, mapFilesJson, outputJson] = process.argv.slice(2);
const lines = fs.readFileSync(logFile, 'utf8').split(/\r?\n/);
const mapFiles = JSON.parse(fs.readFileSync(mapFilesJson, 'utf8'));

const byFile = new Map();
for (const f of mapFiles) {
    byFile.set(f, { file: f, errors: [], warnings: [], codes: [], issues: [] });
}

let currentIndex = -1;
let currentFile = null;
const codeRegex = /\[(DOT[AJX]|INDX|PDF[JX]|XEPJ)\d{3}[EFWI]\]/g;

for (const rawLine of lines) {
    const line = rawLine.replace(/\u001b\[[0-9;]*m/g, '');

    if (/^\s*Validating:\s+/.test(line)) {
        currentIndex += 1;
        currentFile = mapFiles[currentIndex] || null;
        continue;
    }

    if (!currentFile) continue;

    const record = byFile.get(currentFile);
    if (!record) continue;

    if (/\bERROR\s+\[/.test(line)) {
        const trimmed = line.trim();
        record.errors.push(trimmed);
        const codes = line.match(codeRegex) || [];
        for (const c of codes) record.codes.push(c);
        record.issues.push({
            severity: 'error',
            code: codes[0] || null,
            message: trimmed,
        });
    } else if (/\bWARN\s+\[/.test(line)) {
        const trimmed = line.trim();
        record.warnings.push(trimmed);
        const codes = line.match(codeRegex) || [];
        for (const c of codes) record.codes.push(c);
        record.issues.push({
            severity: 'warning',
            code: codes[0] || null,
            message: trimmed,
        });
    }
}

const results = mapFiles.map((f) => {
    const r = byFile.get(f);
    const uniqueCodes = [...new Set(r.codes)].sort();
    return {
        file: f,
        errorCount: r.errors.length,
        warningCount: r.warnings.length,
        codes: uniqueCodes,
        errors: r.errors,
        warnings: r.warnings,
        issues: r.issues,
    };
});

const out = {
    generatedAt: new Date().toISOString(),
    fileCount: mapFiles.length,
    parsedValidatingBlocks: Math.max(0, currentIndex + 1),
    results,
};

fs.writeFileSync(outputJson, JSON.stringify(out, null, 2));
console.log(`Parsed ${out.parsedValidatingBlocks}/${mapFiles.length} validation blocks.`);
