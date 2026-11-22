/**
 * DITA-OT Launch
 * How DITA Craft launches the `dita` command, and the limit it runs into on Windows.
 *
 * On Windows, `bin/dita.bat` puts every plugin library on the Java command line with the full
 * path of the DITA-OT folder, and cmd.exe refuses a command line longer than 8,191 characters:
 * DITA-OT 4.3.5 and its bundled plugins stop working from a folder path of 97 characters, less
 * with long publishing arguments or more plugins. So DITA Craft launches `dita.bat` from the
 * short (8.3) path of its folder, which shortens every entry, and checks the length of the
 * command line before launching. See docs/STUDY_DITA_OT_PLUGIN_UNINSTALL.md, section 7.
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/** The longest command line that cmd.exe runs */
export const CMD_EXE_LINE_LIMIT = 8191;

/** Room for the arguments of a publish (input, output, temporary folder, filter) */
export const PUBLISH_ARGUMENTS_ALLOWANCE = 300;

/** Above this length, the folder a DITA-OT is installed into deserves a warning on Windows */
export const DEEP_INSTALL_FOLDER_LENGTH = 80;

export interface DitaLaunch {
    /** The program to spawn: the command itself, or cmd.exe for a batch file */
    file: string;
    args: string[];
    env: NodeJS.ProcessEnv;
}

export interface DitaLaunchPlan {
    launch: DitaLaunch;
    /** Windows batch files only: the length of the Java command line that dita.bat builds */
    commandLineLength?: number;
    /** Windows batch files only: the DITA-OT folder, as DITA Craft found it */
    ditaOtFolder?: string;
}

export interface LaunchOptions {
    platform?: NodeJS.Platform;
    /** The short (8.3) path of a folder, or the folder itself when it has none */
    shortPath?: (folder: string) => string;
}

/** DITA-OT cannot run on Windows: its command line would be too long for cmd.exe. */
export class DitaCommandLineTooLongError extends Error {
    constructor(readonly ditaOtFolder: string, readonly commandLineLength: number) {
        super(`DITA-OT cannot run from ${ditaOtFolder} on Windows: its command line would be `
            + `${formatNumber(commandLineLength)} characters long, over the ${formatNumber(CMD_EXE_LINE_LIMIT)}-character limit of cmd.exe. `
            + 'Move DITA-OT to a shorter folder, such as C:\\DITA-OT, then run DITA: Configure DITA-OT Path.');
        this.name = 'DitaCommandLineTooLongError';
    }
}

/** True for a DITA-OT folder: `bin/dita` (or `.bat`, `.cmd`) and a `plugins` folder. */
export function isDitaOtHome(dir: string): boolean {
    const bin = path.join(dir, 'bin');
    return ['dita', 'dita.bat', 'dita.cmd'].some(name => fs.existsSync(path.join(bin, name)))
        && fs.existsSync(path.join(dir, 'plugins'));
}

/** The first file of this name in the folders of a PATH value. */
export function findOnPath(name: string, pathEnv: string): string | undefined {
    for (const dir of pathEnv.split(path.delimiter).filter(Boolean)) {
        const candidate = path.join(dir, name);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

/**
 * The DITA-OT folder of a `dita` command: the folder above its `bin`, for a command given by
 * its path or, for a bare name, for the first match on the PATH. Symbolic links are followed,
 * as Homebrew links `dita` into its own `bin`. Undefined when that folder is not a DITA-OT
 * folder (a wrapper script elsewhere, for instance).
 */
export function findDitaOtHome(command: string, pathEnv: string = process.env.PATH ?? ''): string | undefined {
    const candidates = isPath(command)
        ? [command]
        : pathEnv.split(path.delimiter).filter(Boolean).map(dir => path.join(dir, command));
    for (const candidate of candidates) {
        let real: string;
        try {
            real = fs.realpathSync(candidate);
        } catch {
            continue;
        }
        const home = path.dirname(path.dirname(real));
        if (isDitaOtHome(home)) {
            return home;
        }
    }
    return undefined;
}

const shortPathCache = new Map<string, string>();

/**
 * The short (8.3) path of an existing folder on Windows, as cmd.exe gives it; the folder itself
 * when Windows has no short name for it (8.3 names can be disabled on a volume), when cmd.exe
 * cannot say, or when the path holds characters that cmd.exe would interpret. Cached.
 */
export function windowsShortPath(folder: string): string {
    const cached = shortPathCache.get(folder);
    if (cached !== undefined) {
        return cached;
    }
    let result = folder;
    if (!/[%"^!\r\n]/.test(folder)) {
        try {
            const output = (spawnSync('cmd.exe', ['/d', '/s', '/c', `"for %I in ("${folder}") do @echo %~sI"`], {
                encoding: 'utf8',
                windowsVerbatimArguments: true,
                windowsHide: true,
                timeout: 10000
            }).stdout ?? '').trim();
            // A path that cmd.exe printed in another code page does not exist: keep the folder.
            if (output && !/[\r\n]/.test(output) && fs.existsSync(output)) {
                result = output;
            }
        } catch {
            // Keep the folder.
        }
    }
    shortPathCache.set(folder, result);
    return result;
}

/**
 * The length of the Java command line that `bin/dita.bat` builds to run `dita <args>` when it
 * is launched as `script`: the line that cmd.exe checks against its limit. It follows DITA-OT
 * 4.x's launcher: `DITA_HOME` is always the folder of the script followed by `\..`; the plugin
 * libraries of `config/env.bat` are on the class path, except for `install` and `uninstall`.
 * Undefined when the launcher is not one this estimate knows.
 */
export function estimateDitaCommandLine(script: string, args: string[], env: NodeJS.ProcessEnv = process.env): number | undefined {
    let launcher: string;
    try {
        launcher = fs.readFileSync(script, 'utf8');
    } catch {
        return undefined;
    }
    const javaLine = launcher.split(/\r?\n/).find(line => line.includes('%_JAVACMD%') && line.includes('%CLASSPATH%'));
    if (!javaLine) {
        return undefined;
    }

    const variable = (name: string): string => {
        const key = Object.keys(env).find(candidate => candidate.toUpperCase() === name.toUpperCase());
        return (key !== undefined ? env[key] : undefined) ?? '';
    };
    const binDir = path.dirname(script);
    const ditaHome = `${binDir}\\..`;
    const quoted = args.map(quoteForCmd);
    const subcommand = quoted[0] ?? '';

    let classpath = variable('CLASSPATH');
    if (subcommand !== 'install' && subcommand !== 'uninstall') {
        let envBat = '';
        try {
            envBat = fs.readFileSync(path.join(binDir, '..', 'config', 'env.bat'), 'utf8');
        } catch {
            // No plugin libraries.
        }
        for (const line of envBat.split(/\r?\n/)) {
            const match = line.match(/^\s*set\s+"CLASSPATH=%CLASSPATH%(.*)"\s*$/i);
            if (match) {
                classpath += match[1].replace(/%DITA_HOME%/gi, ditaHome);
            }
        }
    }

    let javaCommand = variable('JAVACMD');
    const javaHome = variable('JAVA_HOME');
    if (!javaCommand && javaHome && fs.existsSync(path.join(javaHome, 'bin', 'java.exe'))) {
        javaCommand = `${javaHome}\\bin\\java.exe`;
    }
    if (!javaCommand) {
        javaCommand = 'java.exe';
    }

    const values: Record<string, string> = {
        _JAVACMD: javaCommand,
        DITA_HOME: ditaHome,
        CLASSPATH: classpath,
        DITA_CMD_SUBCOMMAND: subcommand,
        DITA_CMD_LINE_ARGS: quoted.map(arg => ` ${arg}`).join('')
    };
    return javaLine.trim().replace(/%([A-Za-z_][\w]*)%/g, (_match, name: string) => values[name.toUpperCase()] ?? variable(name)).length;
}

/**
 * How to run `dita <args>`, with `command` the dita command DITA Craft found: a path to `dita`,
 * `dita.bat` or `dita.cmd`, or a bare name looked up on the PATH. A Windows batch file runs
 * through cmd.exe, launched from the short path of its folder, and the plan gives the length
 * of the command line it builds.
 */
export function planDitaLaunch(command: string, args: string[], env: NodeJS.ProcessEnv, options: LaunchOptions = {}): DitaLaunchPlan {
    const platform = options.platform ?? process.platform;
    if (platform !== 'win32' || !/\.(bat|cmd)$/i.test(command)) {
        return { launch: { file: command, args, env } };
    }
    const script = isPath(command) ? command : findOnPath(command, env.PATH ?? env.Path ?? '');
    if (!script) {
        return { launch: { file: 'cmd.exe', args: ['/c', command, ...args], env } };
    }
    const binDir = path.dirname(script);
    const shortBin = (options.shortPath ?? windowsShortPath)(binDir);
    const launched = path.join(shortBin, path.basename(script));
    return {
        launch: { file: 'cmd.exe', args: ['/c', launched, ...args], env },
        commandLineLength: estimateDitaCommandLine(launched, args, env),
        ditaOtFolder: path.dirname(binDir)
    };
}

/**
 * Like planDitaLaunch, but throws DitaCommandLineTooLongError when the command line would be
 * too long for cmd.exe, instead of letting cmd.exe fail with its own, localized message.
 */
export function prepareDitaLaunch(command: string, args: string[], env: NodeJS.ProcessEnv, options: LaunchOptions = {}): DitaLaunch {
    const plan = planDitaLaunch(command, args, env, options);
    if (plan.commandLineLength !== undefined && plan.commandLineLength > CMD_EXE_LINE_LIMIT && plan.ditaOtFolder) {
        throw new DitaCommandLineTooLongError(plan.ditaOtFolder, plan.commandLineLength);
    }
    return plan.launch;
}

/**
 * A warning when a publish would probably not fit in cmd.exe's command line on Windows, with
 * room for its arguments, as after a plugin install that added libraries; undefined otherwise.
 */
export function publishCommandLineWarning(command: string, env: NodeJS.ProcessEnv, options: LaunchOptions = {}): string | undefined {
    const plan = planDitaLaunch(command, [], env, options);
    if (plan.commandLineLength === undefined || !plan.ditaOtFolder) {
        return undefined;
    }
    const length = plan.commandLineLength + PUBLISH_ARGUMENTS_ALLOWANCE;
    if (length <= CMD_EXE_LINE_LIMIT) {
        return undefined;
    }
    return `Publishing may now fail on Windows: DITA-OT's command line would be about ${formatNumber(length)} characters long, `
        + `over the ${formatNumber(CMD_EXE_LINE_LIMIT)}-character limit of cmd.exe. `
        + `Move DITA-OT (${plan.ditaOtFolder}) to a shorter folder, such as C:\\DITA-OT, or uninstall the plugin.`;
}

/**
 * A warning when a DITA-OT installed into `targetDir` may not run on Windows because its path
 * is long, after shortening what Windows can shorten; undefined otherwise.
 */
export function deepInstallFolderWarning(targetDir: string, version: string, options: LaunchOptions = {}): string | undefined {
    if ((options.platform ?? process.platform) !== 'win32') {
        return undefined;
    }
    const folder = path.join((options.shortPath ?? windowsShortPath)(targetDir), `dita-ot-${version}`);
    if (folder.length <= DEEP_INSTALL_FOLDER_LENGTH) {
        return undefined;
    }
    return `DITA-OT may not run from ${path.join(targetDir, `dita-ot-${version}`)} on Windows: its path is ${folder.length} characters long, `
        + `and DITA-OT's command line grows with it, up to the ${formatNumber(CMD_EXE_LINE_LIMIT)}-character limit of cmd.exe. `
        + 'Choose a shorter folder, such as C:\\DITA-OT.';
}

/** An argument as cmd.exe receives it from Node: quoted when it holds a space, a tab or a quote, or is empty. */
function quoteForCmd(arg: string): string {
    return arg === '' || /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

function isPath(command: string): boolean {
    return command.includes('/') || command.includes('\\');
}

function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}
