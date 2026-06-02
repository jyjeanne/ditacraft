import * as path from 'path';
import * as fs from 'fs';

const MAX_TRAVERSAL_DEPTH = 8;

/**
 * Normalize a user-supplied path into a file:// URI resolved against the workspace root.
 * Accepts relative paths, absolute paths (if within workspace), and file:// URIs.
 * Returns the canonical file:// URI string, or null if the path is invalid/unsafe.
 */
export function resolvePath(input: string, workspaceRoot: string): string | null {
    if (!input || input.trim() === '') {
        return null;
    }

    // Reject URLs
    if (/^https?:\/\//i.test(input)) {
        return null;
    }

    // Reject UNC paths
    if (/^\\\\/.test(input)) {
        return null;
    }

    // Reject null bytes
    if (input.includes('\x00')) {
        return null;
    }

    let resolved: string;

    if (input.startsWith('file://')) {
        resolved = input.slice('file://'.length);
        resolved = decodeURIComponent(resolved);
        // On Windows, file:///C:/... becomes /C:/... — strip the leading slash
        if (/^\/[A-Za-z]:/.test(resolved)) {
            resolved = resolved.slice(1);
        }
    } else if (path.isAbsolute(input)) {
        resolved = input;
    } else {
        resolved = path.resolve(workspaceRoot, input);
    }

    // Normalize slashes
    resolved = path.normalize(resolved);

    // Verify the resolved path is within workspace
    if (!validateWithinWorkspace(resolved, workspaceRoot)) {
        return null;
    }

    // Convert back to file:// URI
    const uri = 'file://' + (resolved.startsWith('/') ? '' : '/') + resolved.split(path.sep).join('/');
    return uri;
}

/**
 * Validate that a resolved file path is within the workspace root.
 * Rejects paths that traverse too many levels above the workspace.
 */
export function validateWithinWorkspace(filePath: string, workspaceRoot: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const normalizedRoot = path.normalize(workspaceRoot);

    // Count parent directory traversals
    const relative = path.relative(normalizedRoot, normalizedPath);
    if (!relative || relative.startsWith('..')) {
        return false;
    }

    // Count levels: reject paths that go too deep with ..
    let traversalCount = 0;
    const parts = normalizedPath.split(path.sep);
    for (const part of parts) {
        if (part === '..') {
            traversalCount++;
            if (traversalCount > MAX_TRAVERSAL_DEPTH) {
                return false;
            }
        }
    }

    // Final check: resolved path must start with workspace root
    return normalizedPath.startsWith(normalizedRoot + path.sep) || normalizedPath === normalizedRoot;
}

/**
 * Check if a file exists at the resolved path.
 */
export function fileExists(fileUri: string, workspaceRoot: string): boolean {
    const resolved = resolvePath(fileUri, workspaceRoot);
    if (!resolved) {
        return false;
    }
    const fsPath = resolved.replace(/^file:\/\/\/?/, '');
    try {
        return fs.existsSync(fsPath);
    } catch {
        return false;
    }
}
