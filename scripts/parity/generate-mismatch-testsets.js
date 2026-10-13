#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function usage() {
  console.error(
    'Usage: node scripts/parity/generate-mismatch-testsets.js <comparisonReportJson> <outputDir>'
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function writeListFile(outputDir, fileName, values) {
  const outPath = path.join(outputDir, fileName);
  const content = values.length > 0 ? `${values.join('\n')}\n` : '';
  fs.writeFileSync(outPath, content, 'utf8');
}

function writeJsonFile(outputDir, fileName, values) {
  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, `${JSON.stringify(values, null, 2)}\n`, 'utf8');
}

function sanitizeSegment(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, '_');
}

function collectBuckets(strictMismatches) {
  const byFamily = new Map();
  const byCode = new Map();

  for (const mismatch of strictMismatches) {
    const file = mismatch.file;
    if (!file) {
      continue;
    }

    for (const family of asArray(mismatch.families)) {
      if (!byFamily.has(family)) {
        byFamily.set(family, []);
      }
      byFamily.get(family).push(file);
    }

    for (const code of [...asArray(mismatch.ditaOtCodes), ...asArray(mismatch.lspCodes)]) {
      if (!byCode.has(code)) {
        byCode.set(code, []);
      }
      byCode.get(code).push(file);
    }
  }

  return { byFamily, byCode };
}

function main() {
  const [, , reportPathArg, outputDirArg] = process.argv;
  if (!reportPathArg || !outputDirArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const reportPath = path.resolve(reportPathArg);
  const outputDir = path.resolve(outputDirArg);
  const report = readJson(reportPath);
  const strictMismatches = asArray(report.strictMismatches);
  const mismatchFiles = uniqueSorted(
    strictMismatches.map((mismatch) => mismatch.file).filter((file) => typeof file === 'string' && file.length > 0)
  );
  const { byFamily, byCode } = collectBuckets(strictMismatches);

  fs.mkdirSync(outputDir, { recursive: true });
  writeListFile(outputDir, 'strict-mismatch-files.txt', mismatchFiles);
  writeJsonFile(outputDir, 'strict-mismatch-files.json', mismatchFiles);

  for (const [family, files] of byFamily.entries()) {
    const sorted = uniqueSorted(files);
    const baseName = `family-${sanitizeSegment(family)}`;
    writeListFile(outputDir, `${baseName}.txt`, sorted);
    writeJsonFile(outputDir, `${baseName}.json`, sorted);
  }

  for (const [code, files] of byCode.entries()) {
    const sorted = uniqueSorted(files);
    const baseName = `code-${sanitizeSegment(code)}`;
    writeListFile(outputDir, `${baseName}.txt`, sorted);
    writeJsonFile(outputDir, `${baseName}.json`, sorted);
  }

  const manifest = {
    reportPath,
    totalStrictMismatches: strictMismatches.length,
    uniqueMismatchFiles: mismatchFiles.length,
    generatedFamilies: uniqueSorted([...byFamily.keys()]),
    generatedCodes: uniqueSorted([...byCode.keys()]),
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const generatedFiles = 2 + byFamily.size * 2 + byCode.size * 2 + 1;
  console.log(`Generated ${generatedFiles} files in ${outputDir} from ${strictMismatches.length} strict mismatches.`);
}

main();
