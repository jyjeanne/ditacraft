/**
 * Shared regex patterns for DITA XML processing.
 * Centralizes patterns previously duplicated across multiple feature files.
 */

/**
 * Regex fragment that matches XML tag attributes (quoted values + unquoted chars).
 * Handles both single and double quotes, and skips `>` inside attribute values.
 *
 * Usage: `new RegExp(\`<element\\b\${TAG_ATTRS}\\battr\\s*=\\s*["']value["']\`)`
 */
export const TAG_ATTRS = `(?:"[^"]*"|'[^']*'|[^>"'])*`;
