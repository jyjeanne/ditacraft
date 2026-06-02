import { Diagnostic } from 'vscode-languageserver-types';

interface StoredDiagnostics {
    diagnostics: Diagnostic[];
    lastUpdated: number;
}

interface QueryOptions {
    severity?: string[];
    limit?: number;
    filePattern?: string;
}

export class DiagnosticsStore {
    private store = new Map<string, StoredDiagnostics>();

    update(fileUri: string, diagnostics: Diagnostic[]): void {
        this.store.set(fileUri, {
            diagnostics,
            lastUpdated: Date.now(),
        });
    }

    query(options: QueryOptions = {}): { totalCount: number; diagnostics: StoredDiagnostic[] } {
        const { severity, limit = 100, filePattern } = options;

        let results: StoredDiagnostic[] = [];

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

    clear(): void {
        this.store.clear();
    }

    getLastUpdateTime(): number {
        let latest = 0;
        for (const stored of this.store.values()) {
            if (stored.lastUpdated > latest) {
                latest = stored.lastUpdated;
            }
        }
        return latest;
    }
}

function diagnosticSeverityLabel(severity?: number): string {
    // LSP DiagnosticSeverity: 1=Error, 2=Warning, 3=Information, 4=Hint
    switch (severity) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'information';
        case 4: return 'hint';
        default: return 'information';
    }
}

function matchGlob(uri: string, pattern: string): boolean {
    // Simple minimatch-like pattern matching for file URIs
    const normalized = uri.replace(/\\/g, '/').toLowerCase();
    const regex = globToRegex(pattern.toLowerCase());
    return regex.test(normalized);
}

function globToRegex(pattern: string): RegExp {
    let regexStr = '';
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        switch (ch) {
            case '*':
                if (pattern[i + 1] === '*') {
                    regexStr += '.*';
                    i++;
                } else {
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
    // Anchored so the pattern matches the full URI, not a substring.
    // (?:^|/) ensures the first segment is always preceded by a path boundary
    // (avoids "bad-topics/" matching a pattern for "topics/").
    return new RegExp('(?:^|/)' + regexStr + '$');
}

export interface StoredDiagnostic {
    file: string;
    line: number;
    column: number;
    code: string;
    message: string;
    severity: string;
}
