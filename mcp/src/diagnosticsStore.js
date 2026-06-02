"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsStore = void 0;
class DiagnosticsStore {
    constructor() {
        this.store = new Map();
    }
    update(fileUri, diagnostics) {
        this.store.set(fileUri, {
            diagnostics,
            lastUpdated: Date.now(),
        });
    }
    query(options = {}) {
        const { severity, limit = 100, filePattern } = options;
        let results = [];
        for (const [uri, stored] of this.store) {
            if (filePattern && !matchGlob(uri, filePattern)) {
                continue;
            }
            for (const diag of stored.diagnostics) {
                if (severity && severity.length > 0) {
                    const sev = diagnosticSeverityLabel(diag.severity);
                    if (!severity.includes(sev)) {
                        continue;
                    }
                }
                results.push({
                    file: uri,
                    line: diag.range.start.line + 1,
                    column: diag.range.start.character + 1,
                    code: typeof diag.code === 'string' ? diag.code : String(diag.code ?? ''),
                    message: diag.message,
                    severity: diagnosticSeverityLabel(diag.severity),
                });
            }
        }
        const totalCount = results.length;
        if (limit > 0 && results.length > limit) {
            results = results.slice(0, limit);
        }
        return { totalCount, diagnostics: results };
    }
    clear() {
        this.store.clear();
    }
    getLastUpdateTime() {
        let latest = 0;
        for (const stored of this.store.values()) {
            if (stored.lastUpdated > latest) {
                latest = stored.lastUpdated;
            }
        }
        return latest;
    }
}
exports.DiagnosticsStore = DiagnosticsStore;
function diagnosticSeverityLabel(severity) {
    // LSP DiagnosticSeverity: 1=Error, 2=Warning, 3=Information, 4=Hint
    switch (severity) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'information';
        case 4: return 'hint';
        default: return 'information';
    }
}
function matchGlob(uri, pattern) {
    // Simple minimatch-like pattern matching for file URIs
    const normalized = uri.replace(/\\/g, '/').toLowerCase();
    const regex = globToRegex(pattern.toLowerCase());
    return regex.test(normalized);
}
function globToRegex(pattern) {
    let regexStr = '';
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        switch (ch) {
            case '*':
                if (pattern[i + 1] === '*') {
                    regexStr += '.*';
                    i++;
                }
                else {
                    regexStr += '[^/]*';
                }
                break;
            case '?':
                regexStr += '[^/]';
                break;
            case '.':
            case '(':
            case ')':
            case '+':
            case '^':
            case '$':
            case '{':
            case '}':
            case '[':
            case ']':
            case '|':
            case '\\':
                regexStr += '\\' + ch;
                break;
            default:
                regexStr += ch;
        }
    }
    return new RegExp(regexStr);
}
//# sourceMappingURL=diagnosticsStore.js.map