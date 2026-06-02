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
exports.collectDitaFiles = collectDitaFiles;
exports.collectDitaFilesAsync = collectDitaFilesAsync;
exports.findCrossFileReferences = findCrossFileReferences;
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const node_1 = require("vscode-languageserver/node");
const vscode_uri_1 = require("vscode-uri");
const referenceParser_1 = require("./referenceParser");
const textUtils_1 = require("./textUtils");
/** File extensions considered DITA files. */
const DITA_EXTENSIONS = new Set(['.dita', '.ditamap', '.bookmap']);
/** Directories to skip during recursive scanning. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', '.vscode', '.vscode-test']);
/**
 * Collect all DITA files in the given workspace folders.
 * Synchronous recursive directory walk.
 */
function collectDitaFiles(workspaceFolders) {
    const files = [];
    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    walk(path.join(dir, entry.name));
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (DITA_EXTENSIONS.has(ext)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        }
    }
    for (const folder of workspaceFolders) {
        walk(folder);
    }
    return files;
}
/**
 * Collect all DITA files in the given workspace folders.
 * Async recursive directory walk — does not block the server thread.
 */
async function collectDitaFilesAsync(workspaceFolders) {
    const files = [];
    async function walk(dir) {
        let entries;
        try {
            entries = await fs_1.promises.readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        const subdirs = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    subdirs.push(walk(path.join(dir, entry.name)));
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (DITA_EXTENSIONS.has(ext)) {
                    files.push(path.join(dir, entry.name));
                }
            }
        }
        await Promise.all(subdirs);
    }
    await Promise.all(workspaceFolders.map(folder => walk(folder)));
    return files;
}
/**
 * Find all references to a target ID across all DITA files in the workspace.
 *
 * Filtering:
 * - href/conref with file path: only included if the path resolves to targetFilePath
 * - href/conref fragment-only: only included if found in the target file itself
 * - conkeyref: included by element ID match (cannot resolve key synchronously)
 */
function findCrossFileReferences(targetId, targetFilePath, workspaceFolders, excludeUri, documents) {
    const results = [];
    const ditaFiles = collectDitaFiles(workspaceFolders);
    const normalizedTargetPath = path.normalize(targetFilePath);
    for (const filePath of ditaFiles) {
        const fileUri = vscode_uri_1.URI.file(filePath).toString();
        // Skip the current document (already searched by the caller)
        if (excludeUri && fileUri === excludeUri) {
            continue;
        }
        // Prefer in-memory content for open documents (may have unsaved changes)
        const openDoc = documents?.get(fileUri);
        let content;
        if (openDoc) {
            content = openDoc.getText();
        }
        else {
            try {
                content = fs.readFileSync(filePath, 'utf-8');
            }
            catch {
                continue;
            }
        }
        const refs = (0, referenceParser_1.findReferencesToId)(content, targetId);
        if (refs.length === 0)
            continue;
        const fileDir = path.dirname(filePath);
        for (const ref of refs) {
            if (ref.type === 'href' || ref.type === 'conref') {
                const parsed = (0, referenceParser_1.parseReference)(ref.value);
                if (parsed.filePath) {
                    // Cross-file ref: check path resolves to target
                    const resolvedPath = path.normalize(path.resolve(fileDir, parsed.filePath));
                    if (resolvedPath !== normalizedTargetPath) {
                        continue;
                    }
                }
                else {
                    // Fragment-only ref: only relevant if in the target file itself
                    if (path.normalize(filePath) !== normalizedTargetPath) {
                        continue;
                    }
                }
            }
            // conkeyref: include all matches by element ID
            const startPos = (0, textUtils_1.offsetToPosition)(content, ref.valueStart);
            const endPos = (0, textUtils_1.offsetToPosition)(content, ref.valueEnd);
            results.push(node_1.Location.create(fileUri, { start: startPos, end: endPos }));
        }
    }
    return results;
}
//# sourceMappingURL=workspaceScanner.js.map