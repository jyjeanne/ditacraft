/**
 * DITA-OT Launch Test Suite
 * How the `dita` command is launched, and the Windows command line limit of `dita.bat`:
 * the estimate of the Java command line, the short path launch, and the warnings.
 * Windows is simulated with the `platform` option, so the suite runs on every platform.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    CMD_EXE_LINE_LIMIT,
    DitaCommandLineTooLongError,
    deepInstallFolderWarning,
    estimateDitaCommandLine,
    planDitaLaunch,
    prepareDitaLaunch,
    publishCommandLineWarning,
    windowsShortPath
} from '../../utils/ditaOtLaunch';

/** The Java command line of DITA-OT 4.3.5's bin/dita.bat (Apache License 2.0). */
const JAVA_LINE = '"%_JAVACMD%" -Djava.awt.headless=true -Dcli.log-format=fancy -Dcli.color=true -Dsun.io.useCanonCaches=true %ANT_OPTS% -classpath "%DITA_HOME%\\lib\\ant-launcher.jar;%DITA_HOME%\\config" "-Dant.home=%DITA_HOME%"  "-Ddita.dir=%DITA_HOME%" org.apache.tools.ant.launch.Launcher %ANT_ARGS% -cp "%CLASSPATH%" %DITA_CMD_LINE_ARGS% -buildfile "%DITA_HOME%\\build.xml" -main "org.dita.dost.invoker.Main"';

suite('DITA-OT Launch Test Suite', () => {
    let root: string;
    let ditaOt: string;
    let script: string;

    /** A DITA-OT folder with DITA-OT 4.3.5's Java line and `libraries` plugin libraries in env.bat. */
    function makeDitaOt(folder: string, libraries: string[]): string {
        fs.mkdirSync(path.join(folder, 'bin'), { recursive: true });
        fs.mkdirSync(path.join(folder, 'config'), { recursive: true });
        fs.mkdirSync(path.join(folder, 'plugins'), { recursive: true });
        fs.writeFileSync(path.join(folder, 'bin', 'dita.bat'), `@echo off\r\nset DITA_HOME=%~dp0..\r\n:runAnt\r\n${JAVA_LINE}\r\nexit /b\r\n`);
        fs.writeFileSync(path.join(folder, 'config', 'env.bat'),
            libraries.map(lib => `set "CLASSPATH=%CLASSPATH%;%DITA_HOME%\\plugins\\${lib}"\r\n`).join(''));
        return path.join(folder, 'bin', 'dita.bat');
    }

    /** The expected line, built the way dita.bat builds it. */
    function expectedLine(scriptPath: string, libraries: string[], args: string, javaCommand = 'java.exe'): number {
        const home = `${path.dirname(scriptPath)}\\..`;
        const classpath = libraries.map(lib => `;${home}\\plugins\\${lib}`).join('');
        return JAVA_LINE
            .replace('%_JAVACMD%', javaCommand)
            .replace(/%ANT_OPTS%|%ANT_ARGS%/g, '')
            .replace(/%DITA_HOME%/g, home)
            .replace('%CLASSPATH%', classpath)
            .replace('%DITA_CMD_LINE_ARGS%', args).length;
    }

    const LIBRARIES = ['org.dita.pdf2\\lib\\fo.jar', 'org.dita.index\\lib\\index.jar', 'com.example\\lib\\example-1.0.jar'];
    const noJava: NodeJS.ProcessEnv = { PATH: '' };

    setup(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-launch-test-'));
        ditaOt = path.join(root, 'dita-ot-4.3.5');
        script = makeDitaOt(ditaOt, LIBRARIES);
    });

    teardown(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    suite('estimateDitaCommandLine', () => {
        test('builds the line as dita.bat does: DITA_HOME is the script folder and \\.., plugin libraries on the class path', () => {
            assert.strictEqual(estimateDitaCommandLine(script, ['plugins'], noJava), expectedLine(script, LIBRARIES, ' plugins'));
        });

        test('grows by the number of plugin libraries plus 5 for each character of the folder path', () => {
            const deeper = makeDitaOt(path.join(root, 'a-longer-folder', 'dita-ot-4.3.5'), LIBRARIES);
            const extra = path.dirname(deeper).length - path.dirname(script).length;
            assert.strictEqual(
                (estimateDitaCommandLine(deeper, ['plugins'], noJava) ?? 0) - (estimateDitaCommandLine(script, ['plugins'], noJava) ?? 0),
                (LIBRARIES.length + 5) * extra
            );
        });

        test('leaves the plugin libraries out for install and uninstall, as dita.bat does', () => {
            assert.strictEqual(estimateDitaCommandLine(script, ['uninstall', 'com.example'], noJava),
                expectedLine(script, [], ' uninstall com.example'));
            assert.strictEqual(estimateDitaCommandLine(script, ['install'], noJava), expectedLine(script, [], ' install'));
        });

        test('counts the quotes of arguments that hold a space', () => {
            assert.strictEqual(estimateDitaCommandLine(script, ['--input', 'my topic.dita'], noJava),
                expectedLine(script, LIBRARIES, ' --input "my topic.dita"'));
        });

        test('uses java.exe of JAVA_HOME when it exists, and the CLASSPATH and ANT_OPTS of the environment', () => {
            const javaHome = path.join(root, 'jdk-21');
            fs.mkdirSync(path.join(javaHome, 'bin'), { recursive: true });
            fs.writeFileSync(path.join(javaHome, 'bin', 'java.exe'), '');
            const env = { PATH: '', java_home: javaHome, CLASSPATH: 'C:\\lib\\extra.jar', ANT_OPTS: '-Xmx2g' };
            const withoutEnv = expectedLine(script, LIBRARIES, ' plugins', `${javaHome}\\bin\\java.exe`);
            assert.strictEqual(estimateDitaCommandLine(script, ['plugins'], env), withoutEnv + 'C:\\lib\\extra.jar'.length + '-Xmx2g'.length);
            assert.strictEqual(estimateDitaCommandLine(script, ['plugins'], { PATH: '', JAVA_HOME: path.join(root, 'no-jdk') }),
                expectedLine(script, LIBRARIES, ' plugins'), 'java.exe when JAVA_HOME has none');
        });

        test('knows nothing of a launcher without the Java line, or of a missing script', () => {
            fs.writeFileSync(script, '@echo off\r\njava -jar dita.jar %*\r\n');
            assert.strictEqual(estimateDitaCommandLine(script, ['plugins'], noJava), undefined);
            assert.strictEqual(estimateDitaCommandLine(path.join(root, 'missing', 'dita.bat'), ['plugins'], noJava), undefined);
        });
    });

    suite('prepareDitaLaunch', () => {
        const windows = (shortPath: (folder: string) => string = folder => folder) => ({ platform: 'win32' as NodeJS.Platform, shortPath });

        test('runs the command itself outside Windows', () => {
            const launch = prepareDitaLaunch('/opt/dita-ot/bin/dita', ['plugins'], noJava, { platform: 'linux' });
            assert.deepStrictEqual([launch.file, launch.args], ['/opt/dita-ot/bin/dita', ['plugins']]);
        });

        test('runs dita.bat through cmd.exe from the short path of its folder on Windows', () => {
            const shortBin = path.join(root, 'DITA-O~1', 'bin');
            fs.mkdirSync(path.dirname(shortBin));
            fs.cpSync(path.dirname(script), shortBin, { recursive: true });
            const launch = prepareDitaLaunch(script, ['plugins'], noJava, windows(folder => (folder === path.dirname(script) ? shortBin : folder)));
            assert.deepStrictEqual([launch.file, launch.args], ['cmd.exe', ['/c', path.join(shortBin, 'dita.bat'), 'plugins']]);
        });

        test('finds a bare dita.bat on the PATH', () => {
            const launch = prepareDitaLaunch('dita.bat', ['plugins'], { PATH: path.dirname(script) }, windows());
            assert.deepStrictEqual(launch.args, ['/c', script, 'plugins']);
        });

        test('refuses a command line too long for cmd.exe, and says why', () => {
            const many = Array.from({ length: 200 }, (_, i) => `com.example.plugin${i}\\lib\\library-with-a-long-name-${i}.jar`);
            const crowded = makeDitaOt(path.join(root, 'crowded', 'dita-ot-4.3.5'), many);
            assert.throws(() => prepareDitaLaunch(crowded, ['plugins'], noJava, windows()), (error: unknown) => {
                assert.ok(error instanceof DitaCommandLineTooLongError);
                assert.strictEqual(error.ditaOtFolder, path.join(root, 'crowded', 'dita-ot-4.3.5'));
                assert.ok(error.commandLineLength > CMD_EXE_LINE_LIMIT);
                assert.match(error.message, /^DITA-OT cannot run from .+ on Windows: its command line would be [\d,]+ characters long, over the 8,191-character limit of cmd\.exe\. Move DITA-OT to a shorter folder/);
                return true;
            });
        });

        test('the short path of a deep folder makes its command line fit', () => {
            const libraries = Array.from({ length: 40 }, (_, i) => `com.example.plugin${i}\\lib\\lib-${i}.jar`);
            const deep = makeDitaOt(path.join(root, 'd'.repeat(120), 'dita-ot-4.3.5'), libraries);
            const short = makeDitaOt(path.join(root, 'S'), libraries);
            assert.throws(() => prepareDitaLaunch(deep, ['plugins'], noJava, windows()), DitaCommandLineTooLongError);
            const launch = prepareDitaLaunch(deep, ['plugins'], noJava, windows(folder => (folder === path.dirname(deep) ? path.dirname(short) : folder)));
            assert.deepStrictEqual(launch.args, ['/c', short, 'plugins']);
        });

        test('allows install and uninstall even when the plugin libraries would not fit', () => {
            const many = Array.from({ length: 200 }, (_, i) => `com.example.plugin${i}\\lib\\library-with-a-long-name-${i}.jar`);
            const crowded = makeDitaOt(path.join(root, 'crowded', 'dita-ot-4.3.5'), many);
            assert.doesNotThrow(() => prepareDitaLaunch(crowded, ['uninstall', 'com.example.plugin1'], noJava, windows()));
        });
    });

    suite('warnings', () => {
        test('publishCommandLineWarning keeps room for the arguments of a publish', () => {
            const onWindows = { platform: 'win32' as NodeJS.Platform, shortPath: (folder: string) => folder };
            // One library whose name puts the line, without arguments, `margin` characters under the limit.
            const withMargin = (margin: number): string => {
                const folder = path.join(root, `margin-${margin}`);
                const base = estimateDitaCommandLine(makeDitaOt(folder, ['x.jar']), [], noJava) ?? 0;
                const scriptPath = makeDitaOt(folder, [`${'x'.repeat(CMD_EXE_LINE_LIMIT - margin - base)}x.jar`]);
                assert.strictEqual(planDitaLaunch(scriptPath, [], noJava, onWindows).commandLineLength, CMD_EXE_LINE_LIMIT - margin);
                return scriptPath;
            };
            assert.match(publishCommandLineWarning(withMargin(100), noJava, onWindows) ?? '',
                /^Publishing may now fail on Windows: DITA-OT's command line would be about 8,391 characters long, over the 8,191-character limit of cmd\.exe\. Move DITA-OT \(.+\) to a shorter folder, such as C:\\DITA-OT, or uninstall the plugin\.$/);
            assert.strictEqual(publishCommandLineWarning(withMargin(400), noJava, onWindows), undefined);
            assert.strictEqual(publishCommandLineWarning(script, noJava, onWindows), undefined);
            assert.strictEqual(publishCommandLineWarning(withMargin(100), noJava, { platform: 'linux' }), undefined);
        });

        test('deepInstallFolderWarning warns above 80 characters, after shortening', () => {
            const deep = 'C:\\' + 'a-folder\\'.repeat(9);
            assert.match(deepInstallFolderWarning(deep, '4.4.2', { platform: 'win32', shortPath: f => f }) ?? '',
                /^DITA-OT may not run from .+dita-ot-4\.4\.2 on Windows: its path is \d+ characters long/);
            assert.strictEqual(deepInstallFolderWarning(deep, '4.4.2', { platform: 'win32', shortPath: () => 'C:\\AFOLDE~1' }), undefined);
            assert.strictEqual(deepInstallFolderWarning('C:\\DITA', '4.4.2', { platform: 'win32', shortPath: f => f }), undefined);
            assert.strictEqual(deepInstallFolderWarning(deep, '4.4.2', { platform: 'darwin' }), undefined);
        });
    });

    suite('windowsShortPath', () => {
        test('gives an existing folder, and keeps paths that cmd.exe would interpret', function () {
            if (process.platform !== 'win32') {
                this.skip();
            }
            const short = windowsShortPath(ditaOt);
            assert.ok(fs.existsSync(short));
            assert.strictEqual(fs.realpathSync.native(short).toLowerCase(), fs.realpathSync.native(ditaOt).toLowerCase());
            assert.strictEqual(windowsShortPath('C:\\100%\\bin'), 'C:\\100%\\bin');
        });
    });
});
