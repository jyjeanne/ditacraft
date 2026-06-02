"use strict";
/**
 * Shared text utilities for DITA validation.
 * Centralizes functions previously duplicated across multiple feature files.
 */
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
exports.stripCommentsAndCDATA = stripCommentsAndCDATA;
exports.stripCommentsAndCodeContent = stripCommentsAndCodeContent;
exports.offsetToRange = offsetToRange;
exports.offsetToPosition = offsetToPosition;
exports.normalizeFsPath = normalizeFsPath;
exports.escapeRegex = escapeRegex;
exports.uriToPath = uriToPath;
const path = __importStar(require("path"));
const node_1 = require("vscode-languageserver/node");
const vscode_uri_1 = require("vscode-uri");
/**
 * Strip XML comments and CDATA sections, preserving line structure
 * so that line/column offsets remain valid.
 *
 * Use this when rules need to inspect element content (e.g., checking
 * what's inside `<pre>`). For ID/cross-ref validation where code content
 * could cause false positives, use {@link stripCommentsAndCodeContent}.
 */
function stripCommentsAndCDATA(text) {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}
/**
 * Strip XML comments, CDATA sections, **and** code/pre element content,
 * preserving line structure so that line/column offsets remain valid.
 *
 * Code element content (codeblock, pre, screen, msgblock) is blanked to
 * prevent false positives from literal XML examples (e.g., `&lt;variable id="x">`).
 * The opening/closing tags are preserved since they may carry real attributes.
 */
function stripCommentsAndCodeContent(text) {
    return stripCommentsAndCDATA(text)
        .replace(/(<(codeblock|pre|screen|msgblock)\b[^>]*>)([\s\S]*?)(<\/\2>)/g, (_m, open, _tag, content, close) => open + content.replace(/[^\n\r]/g, ' ') + close);
}
/**
 * Convert byte offsets to an LSP Range. Handles `\r\n` correctly.
 */
function offsetToRange(text, start, end) {
    let line = 0;
    let char = 0;
    let startLine = 0;
    let startChar = 0;
    let endLine = 0;
    let endChar = 0;
    const safeStart = Math.min(start, text.length);
    const safeEnd = Math.min(end, text.length);
    for (let i = 0; i <= safeEnd; i++) {
        if (i === safeStart) {
            startLine = line;
            startChar = char;
        }
        if (i === safeEnd) {
            endLine = line;
            endChar = char;
            break;
        }
        if (text[i] === '\r') {
            line++;
            char = 0;
            if (i + 1 <= safeEnd && text[i + 1] === '\n') {
                i++;
                if (i === safeStart) {
                    startLine = line;
                    startChar = char;
                }
                if (i === safeEnd) {
                    endLine = line;
                    endChar = char;
                    break;
                }
            }
        }
        else if (text[i] === '\n') {
            line++;
            char = 0;
        }
        else {
            char++;
        }
    }
    return node_1.Range.create(startLine, startChar, endLine, endChar);
}
/**
 * Convert a byte offset in `text` to a zero-based { line, character } position.
 * Handles `\r\n`, standalone `\r`, and `\n` line endings.
 *
 * This is the single canonical implementation — use it instead of local copies
 * in feature files (e.g., `findLineAndColumn` in validation.ts, `offsetToPosition`
 * in workspaceScanner.ts).
 */
function offsetToPosition(text, offset) {
    let line = 0;
    let lastLineStart = 0;
    const safeOffset = Math.min(Math.max(0, offset), text.length);
    for (let i = 0; i < safeOffset; i++) {
        if (text[i] === '\r') {
            line++;
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++;
            }
            lastLineStart = i + 1;
        }
        else if (text[i] === '\n') {
            line++;
            lastLineStart = i + 1;
        }
    }
    return { line, character: safeOffset - lastLineStart };
}
/**
 * Normalize a file system path for comparison.
 * On Windows (case-insensitive), lowercases the path.
 * On Linux/macOS (case-sensitive), preserves case.
 */
function normalizeFsPath(filePath) {
    const resolved = path.resolve(filePath);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
/**
 * Escape special regex characters in a string for use in `new RegExp(...)`.
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Convert a `file://` URI to a file system path with forward slashes.
 *
 * `vscode-uri`'s `URI.fsPath` returns OS-native separators (backslashes on
 * Windows). Normalising to forward slashes produces consistent paths across
 * platforms, which is required for string comparisons inside the LSP server
 * and for Node.js `fs` calls (Node accepts `/` on all platforms).
 */
function uriToPath(uri) {
    return vscode_uri_1.URI.parse(uri).fsPath.replace(/\\/g, '/');
}
//# sourceMappingURL=textUtils.js.map