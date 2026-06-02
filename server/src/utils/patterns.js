"use strict";
/**
 * Shared regex patterns for DITA XML processing.
 * Centralizes patterns previously duplicated across multiple feature files.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_ATTRS = void 0;
/**
 * Regex fragment that matches XML tag attributes (quoted values + unquoted chars).
 * Handles both single and double quotes, and skips `>` inside attribute values.
 *
 * Usage: `new RegExp(\`<element\\b\${TAG_ATTRS}\\battr\\s*=\\s*["']value["']\`)`
 */
exports.TAG_ATTRS = `(?:"[^"]*"|'[^']*'|[^>"'])*`;
//# sourceMappingURL=patterns.js.map