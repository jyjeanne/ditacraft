"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePath = resolvePath;
exports.validateWithinWorkspace = validateWithinWorkspace;
exports.fileExists = fileExists;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const MAX_TRAVERSAL_DEPTH = 8;
/**
 * Normalize a user-supplied path into a file:// URI resolved against the workspace root.
 * Accepts relative paths, absolute paths (if within workspace), and file:// URIs.
 * Returns the canonical file:// URI string, or null if the path is invalid/unsafe.
 */
function resolvePath(input, workspaceRoot) {
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
    let resolved;
    if (input.startsWith('file://')) {
        resolved = input.slice('file://'.length);
        // On Windows, file:///C:/... -> C:/... or file:///C%3A/... -> C:/...
        resolved = decodeURIComponent(resolved);
    }
    else if (path.isAbsolute(input)) {
        resolved = input;
    }
    else {
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
function validateWithinWorkspace(filePath, workspaceRoot) {
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
function fileExists(fileUri, workspaceRoot) {
    const resolved = resolvePath(fileUri, workspaceRoot);
    if (!resolved) {
        return false;
    }
    const fsPath = resolved.replace(/^file:\/\/\/?/, '');
    try {
        return fs.existsSync(fsPath);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=workspace.js.map