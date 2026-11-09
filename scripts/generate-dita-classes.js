/**
 * Generate server/src/data/ditaClasses.ts: the default @class of the elements of the bundled
 * OASIS document types. The language server needs it to decide whether a content reference may
 * reuse an element (DITA 1.3 §2.4.2.2, §3.12.13.7), and has no grammar of its own at run time.
 *
 * The table is built by src/shared/grammar/classTable.ts from the grammars compiled from dtds/
 * (scripts/compile-grammars.js, run first). `npm run test:shared` checks that the generated file
 * matches the grammars: run this script again when the DTDs change.
 *
 * Usage: node scripts/generate-dita-classes.js   (npm run dita-classes)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');
const { compileGrammars } = require('./compile-grammars');

const root = path.resolve(__dirname, '..');

async function generateDitaClasses() {
    await compileGrammars({ quiet: true });
    const toolFile = path.join(root, 'out', 'tools', 'class-table.js');
    await esbuild.build({
        entryPoints: [path.join(root, 'src', 'shared', 'grammar', 'classTable.ts')],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: toolFile,
        logLevel: 'silent',
    });
    delete require.cache[require.resolve(toolFile)];
    const { buildClassTable, renderClassTable } = require(toolFile);

    const grammarsDir = path.join(root, 'out', 'grammars');
    const index = JSON.parse(fs.readFileSync(path.join(grammarsDir, 'index.json'), 'utf8'));
    const grammars = index.grammars.map((entry) => JSON.parse(fs.readFileSync(path.join(grammarsDir, entry.file), 'utf8')));
    const table = buildClassTable(grammars);
    const target = path.join(root, 'server', 'src', 'data', 'ditaClasses.ts');
    fs.writeFileSync(target, renderClassTable(table).replace(/\n/g, os.EOL));
    const overrides = Object.entries(table.overrides).map(([key, entries]) => `${key}: ${Object.keys(entries).length}`).join(', ');
    console.log(`[dita-classes] ${Object.keys(table.base).length} elements (overrides ${overrides}) from ${grammars.length} grammars → ${path.relative(root, target)}`);
}

module.exports = { generateDitaClasses };

if (require.main === module) {
    generateDitaClasses().catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });
}
