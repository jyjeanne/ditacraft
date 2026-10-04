/**
 * Image files for the visual editor: the href a topic uses for a file, where a pasted image is
 * saved and under which name.
 *
 * No `vscode` import: unit-tested with plain Mocha.
 */

import * as path from 'path';
import { pathToFileURL } from 'url';

/**
 * The URI reference topic `fromDoc` uses for `file`: relative, with "/" separators and the
 * characters that would end or break a URI path escaped; a file on another drive gets a
 * `file:` URI.
 */
export function hrefFor(fromDoc: string, file: string): string {
    const relative = path.relative(path.dirname(fromDoc), file);
    if (path.isAbsolute(relative)) {
        return pathToFileURL(file).href; // another drive (Windows)
    }
    return relative.split(path.sep).map((segment) => segment.replace(/[%# ?]/g, (c) => encodeURIComponent(c))).join('/');
}

const MIME_EXTENSIONS: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg',
    'image/webp': 'webp', 'image/bmp': 'bmp', 'image/tiff': 'tif',
};

/** File extension for an image media type (png when unknown). */
export function extensionForMime(mime: string): string {
    return MIME_EXTENSIONS[mime.toLowerCase()] ?? 'png';
}

/** The folder pasted images go to: `setting` relative to the topic's folder, or absolute; `${workspaceFolder}` expanded. */
export function pastedImageFolder(setting: string, docPath: string, workspaceFolder: string | undefined): string {
    const value = (setting.trim() || 'images').replace(/\$\{workspaceFolder\}/g, workspaceFolder ?? path.dirname(docPath));
    return path.resolve(path.dirname(docPath), value);
}

/** `<topic name>-<n>.<ext>`, the first n not taken in the folder. */
export function pastedImageName(docPath: string, ext: string, taken: (name: string) => boolean): string {
    const base = path.basename(docPath).replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-') || 'image';
    for (let n = 1; ; n++) {
        const name = `${base}-${n}.${ext}`;
        if (!taken(name)) {
            return name;
        }
    }
}
