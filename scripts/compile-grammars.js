/**
 * Compile the bundled OASIS DTD shells into grammar JSON (out/grammars/).
 *
 * The compiler is TypeScript (src/shared/grammar/); this script bundles its build entry
 * with esbuild into out/tools/ and runs it. The build is skipped when the compiler and
 * every file under dtds/ are unchanged (fingerprint in out/grammars/index.json).
 *
 * Usage: node scripts/compile-grammars.js [--force]
 * Also called by esbuild.js before the extension bundles are built.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');

async function compileGrammars({ force = false, quiet = false } = {}) {
    const toolFile = path.join(root, 'out', 'tools', 'build-grammars.js');
    await esbuild.build({
        entryPoints: [path.join(root, 'src', 'shared', 'grammar', 'buildGrammars.ts')],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: toolFile,
        logLevel: 'silent',
    });
    const salt = crypto.createHash('sha1').update(fs.readFileSync(toolFile)).digest('hex');
    delete require.cache[require.resolve(toolFile)];
    const { buildBundledGrammars } = require(toolFile);
    const result = buildBundledGrammars({
        dtdsDir: path.join(root, 'dtds'),
        outDir: path.join(root, 'out', 'grammars'),
        salt,
        force,
    });
    if (!quiet) {
        if (result.skipped) {
            console.log(`[grammars] up to date (${result.compiled.length} grammars)`);
        } else {
            console.log(`[grammars] compiled ${result.compiled.length} grammars in ${result.elapsedMs} ms`);
        }
    }
    if (result.failures.length > 0) {
        for (const failure of result.failures) {
            console.error(`[grammars] ✘ ${failure.shell}: ${failure.error}`);
        }
        throw new Error(`${result.failures.length} DTD shell(s) failed to compile`);
    }
    return result;
}

module.exports = { compileGrammars };

if (require.main === module) {
    compileGrammars({ force: process.argv.includes('--force') }).catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });
}
