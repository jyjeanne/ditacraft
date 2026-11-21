/**
 * DITA-OT Plugin Files
 * The file system side of plugin management: DITA-OT's configuration, the plugin.xml files of
 * the plugin folders, and the backup that lets an uninstall be rolled back.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface PluginXmlFile {
    /** Absolute path of the plugin folder */
    folder: string;
    xml: string;
}

export interface PluginFolderBackup {
    /** Temporary folder that holds the copy; removed when the backup is discarded */
    path: string;
    /** The copy of the plugin folder */
    copy: string;
}

/** The text of `<DITA-OT>/config/configuration.properties`, or '' when it cannot be read. */
export function readDitaOtConfiguration(ditaOtPath: string): string {
    try {
        return fs.readFileSync(path.join(ditaOtPath, 'config', 'configuration.properties'), 'utf8');
    } catch {
        return '';
    }
}

/** The plugin.xml of every subfolder of the given plugin folders; unreadable folders are skipped. */
export function listPluginXmlFiles(pluginDirs: string[]): PluginXmlFile[] {
    const files: PluginXmlFile[] = [];
    for (const dir of pluginDirs) {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }
            const folder = path.join(dir, entry.name);
            try {
                files.push({ folder, xml: fs.readFileSync(path.join(folder, 'plugin.xml'), 'utf8') });
            } catch {
                // Not a plugin folder.
            }
        }
    }
    return files;
}

/**
 * Copy a plugin folder to a new temporary folder. Throws when the plugin folder does not
 * exist or cannot be copied, so that nothing is removed without a backup.
 */
export function backupPluginFolder(pluginFolder: string, pluginId: string, backupRoot = os.tmpdir()): PluginFolderBackup {
    if (!fs.statSync(pluginFolder, { throwIfNoEntry: false })?.isDirectory()) {
        throw new Error(`Plugin folder not found: ${pluginFolder}`);
    }
    const backupPath = fs.mkdtempSync(path.join(backupRoot, `ditacraft-plugin-${pluginId}-`));
    const copy = path.join(backupPath, pluginId);
    try {
        fs.cpSync(pluginFolder, copy, { recursive: true });
    } catch (error: unknown) {
        fs.rmSync(backupPath, { recursive: true, force: true });
        throw new Error(`Could not back up ${pluginFolder}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { path: backupPath, copy };
}

/** Put the plugin folder back from its backup, replacing whatever is left of it. */
export function restorePluginFolder(backup: PluginFolderBackup, pluginFolder: string): void {
    fs.rmSync(pluginFolder, { recursive: true, force: true });
    fs.cpSync(backup.copy, pluginFolder, { recursive: true });
}

/** Remove a backup that is no longer needed; a failure only leaves a temporary folder behind. */
export function discardPluginBackup(backup: PluginFolderBackup): void {
    try {
        fs.rmSync(backup.path, { recursive: true, force: true });
    } catch {
        // Left in the temporary folder.
    }
}
