/**
 * DITA-OT Error Parser
 * Parses DITA-OT output to extract structured error information
 * for display in the VS Code Problems panel
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from './logger';

/**
 * Represents a parsed DITA-OT error or warning
 */
export interface DitaOtError {
    /** Error/warning code (e.g., DOTX001E, DOTJ001F) */
    code: string;
    /** Severity: error, warning, or info */
    severity: 'error' | 'warning' | 'info';
    /** Error message */
    message: string;
    /** Source file path (if available) */
    filePath?: string;
    /** Line number (1-based, if available) */
    line?: number;
    /** Column number (1-based, if available) */
    column?: number;
    /** Raw output line */
    rawLine: string;
}

/**
 * Parsed result containing all errors and warnings
 */
export interface ParsedDitaOtOutput {
    errors: DitaOtError[];
    warnings: DitaOtError[];
    infos: DitaOtError[];
    /** Whether the build was successful overall */
    buildSuccessful: boolean;
    /** Summary message */
    summary: string;
}

/**
 * DITA-OT error code patterns
 * Format: [DOTX001E], [DOTJ001F], etc.
 * - DOT = DITA-OT
 * - X/J/etc = module (X=XSLT, J=Java, etc.)
 * - 001 = error number
 * - E/W/F/I = severity (Error, Warning, Fatal, Info)
 */
const ERROR_CODE_PATTERN = /\[(DOT[A-Z]\d{3}[EWFI])\]/;

/**
 * Patterns for extracting file paths and line numbers from DITA-OT output
 */
const ERROR_PATTERNS = [
    // Pattern: [DOTX001E][ERROR] message at file:line:column
    {
        regex: /\[(DOT[A-Z]\d{3}[EWFI])\]\s*\[(ERROR|WARN|INFO|FATAL)\]\s*(.+?)\s+at\s+(.+?):(\d+)(?::(\d+))?/i,
        groups: { code: 1, severity: 2, message: 3, file: 4, line: 5, column: 6 }
    },
    // Pattern: [DOTX001E][ERROR] File "path" message
    {
        regex: /\[(DOT[A-Z]\d{3}[EWFI])\]\s*\[(ERROR|WARN|INFO|FATAL)\]\s*(?:File\s+)?["']?([^"'\n]+?\.(dita|ditamap|xml|ditaval))["']?\s*[:-]?\s*(.+)/i,
        groups: { code: 1, severity: 2, file: 3, message: 5 }
    },
    // Pattern: [DOTX001E][ERROR] message (no file)
    {
        regex: /\[(DOT[A-Z]\d{3}[EWFI])\]\s*\[(ERROR|WARN|INFO|FATAL)\]\s*(.+)/i,
        groups: { code: 1, severity: 2, message: 3 }
    },
    // Pattern: Error at line X, column Y: message (common XML parser format)
    {
        regex: /(?:Error|Warning)\s+at\s+line\s+(\d+)(?:,?\s*column\s+(\d+))?[:\s]+(.+)/i,
        groups: { line: 1, column: 2, message: 3 }
    },
    // Pattern: file.dita:123: error message (GNU error format)
    {
        regex: /^([^:\s]+?\.(dita|ditamap|xml)):(\d+)(?::(\d+))?:\s*(error|warning)?:?\s*(.+)/i,
        groups: { file: 1, line: 3, column: 4, severity: 5, message: 6 }
    },
    // Pattern: SEVERE/WARNING: message (Java logging format)
    {
        regex: /^(SEVERE|WARNING|INFO):\s*(.+)/i,
        groups: { severity: 1, message: 2 }
    },
    // Pattern: [xslt] file.dita:123: message (Ant XSLT task)
    {
        regex: /\[xslt\]\s*([^:\s]+?\.(dita|ditamap|xml)):(\d+)(?::(\d+))?[:\s]+(.+)/i,
        groups: { file: 1, line: 3, column: 4, message: 5 }
    },
    // Pattern: BUILD FAILED - capture the line for context
    {
        regex: /^BUILD\s+FAILED/i,
        groups: { message: 0 }
    }
];

/**
 * Map severity strings to our severity type
 */
function mapSeverity(severity: string | undefined): 'error' | 'warning' | 'info' {
    if (!severity) {
        return 'error';
    }
    const s = severity.toUpperCase();
    if (s === 'ERROR' || s === 'FATAL' || s === 'SEVERE' || s.endsWith('E') || s.endsWith('F')) {
        return 'error';
    }
    if (s === 'WARN' || s === 'WARNING' || s.endsWith('W')) {
        return 'warning';
    }
    return 'info';
}

/**
 * Parse DITA-OT output to extract structured errors
 */
export function parseDitaOtOutput(output: string, baseDir?: string): ParsedDitaOtOutput {
    const errors: DitaOtError[] = [];
    const warnings: DitaOtError[] = [];
    const infos: DitaOtError[] = [];

    const lines = output.split(/\r?\n/);
    const buildSuccessful = /BUILD\s+SUCCESSFUL/i.test(output);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            continue;
        }

        // Skip non-error lines
        if (!isErrorLine(trimmedLine)) {
            continue;
        }

        const parsed = parseErrorLine(trimmedLine, baseDir);
        if (parsed) {
            switch (parsed.severity) {
                case 'error':
                    errors.push(parsed);
                    break;
                case 'warning':
                    warnings.push(parsed);
                    break;
                case 'info':
                    infos.push(parsed);
                    break;
            }
        }
    }

    // Generate summary
    let summary = '';
    if (buildSuccessful) {
        summary = 'Build successful';
        if (warnings.length > 0) {
            summary += ` with ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
        }
    } else {
        summary = `Build failed with ${errors.length} error${errors.length > 1 ? 's' : ''}`;
        if (warnings.length > 0) {
            summary += ` and ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
        }
    }

    logger.debug('Parsed DITA-OT output', {
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: infos.length,
        buildSuccessful
    });

    return {
        errors,
        warnings,
        infos,
        buildSuccessful,
        summary
    };
}

/**
 * Check if a line likely contains error information
 * Uses word boundaries and specific patterns to reduce false positives
 */
function isErrorLine(line: string): boolean {
    // Check for DITA-OT error codes first (most reliable)
    if (ERROR_CODE_PATTERN.test(line)) {
        return true;
    }

    // Check for XSLT task errors with line numbers
    if (/^\[xslt\].*:\d+:/.test(line)) {
        return true;
    }

    // Check for patterns that indicate actual errors (with word boundaries)
    const errorPatterns = [
        /\[ERROR\]/i,           // [ERROR] marker
        /\[WARN\]/i,            // [WARN] marker
        /\[FATAL\]/i,           // [FATAL] marker
        /^ERROR:/i,             // ERROR: at start of line
        /^WARNING:/i,           // WARNING: at start of line
        /^SEVERE:/i,            // SEVERE: at start of line (Java logging)
        /^FATAL:/i,             // FATAL: at start of line
        /\berror\s+at\s+line\b/i,  // "error at line X"
        /\bwarning\s+at\s+line\b/i, // "warning at line X"
        /:\d+:\s*error/i,       // file.dita:123: error
        /:\d+:\s*warning/i,     // file.dita:123: warning
        /\bBUILD\s+FAILED\b/i,  // BUILD FAILED
        /\bException\b/,        // Java exceptions (case-sensitive)
        /\bfailed\s+with\b/i,   // "failed with error"
        /\bfailed\s+to\b/i,     // "failed to process"
    ];

    return errorPatterns.some(pattern => pattern.test(line));
}

/**
 * Parse a single error line
 */
function parseErrorLine(line: string, baseDir?: string): DitaOtError | null {
    for (const pattern of ERROR_PATTERNS) {
        const match = line.match(pattern.regex);
        if (match) {
            const groups = pattern.groups;

            let filePath: string | undefined;
            if (groups.file !== undefined && match[groups.file]) {
                filePath = match[groups.file];
                // Resolve relative paths
                if (baseDir && filePath && !path.isAbsolute(filePath)) {
                    filePath = path.resolve(baseDir, filePath);
                }
            }

            // Extract values with proper type handling
            const codeValue = groups.code !== undefined ? match[groups.code] : undefined;
            const severityValue = groups.severity !== undefined ? match[groups.severity] : undefined;
            const messageValue = groups.message !== undefined ? match[groups.message] : undefined;
            const lineValue = groups.line !== undefined ? match[groups.line] : undefined;
            const columnValue = groups.column !== undefined ? match[groups.column] : undefined;

            // Determine severity from explicit value or code suffix
            const severityFromCode = codeValue ? codeValue.slice(-1) : undefined;

            // Parse line and column with NaN validation
            const parsedLine = lineValue ? parseInt(lineValue, 10) : undefined;
            const parsedColumn = columnValue ? parseInt(columnValue, 10) : undefined;

            const error: DitaOtError = {
                code: codeValue || 'UNKNOWN',
                severity: mapSeverity(severityValue || severityFromCode),
                message: typeof groups.message === 'number' && groups.message === 0
                    ? line
                    : (messageValue || line),
                filePath,
                line: parsedLine !== undefined && !isNaN(parsedLine) ? parsedLine : undefined,
                column: parsedColumn !== undefined && !isNaN(parsedColumn) ? parsedColumn : undefined,
                rawLine: line
            };

            return error;
        }
    }

    // Fallback: if line contains error keywords but didn't match patterns
    if (isErrorLine(line)) {
        return {
            code: 'UNKNOWN',
            severity: line.toLowerCase().includes('warning') ? 'warning' : 'error',
            message: line,
            rawLine: line
        };
    }

    return null;
}

/** Default width for diagnostic range highlighting */
const DEFAULT_DIAGNOSTIC_RANGE_WIDTH = 80;

/**
 * DiagnosticCollection manager for DITA-OT publishing errors
 */
export class DitaOtDiagnostics implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ditacraft-publishing');
    }

    /**
     * Create a unique key for deduplication
     */
    private createDiagnosticKey(filePath: string, line: number, message: string): string {
        return `${filePath}:${line}:${message}`;
    }

    /**
     * Update diagnostics from parsed DITA-OT output
     */
    public updateFromParsedOutput(
        parsedOutput: ParsedDitaOtOutput,
        fallbackUri?: vscode.Uri
    ): void {
        // Clear previous diagnostics
        this.diagnosticCollection.clear();

        // Group errors by file with deduplication
        const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();
        const seenDiagnostics = new Set<string>();

        const allIssues = [...parsedOutput.errors, ...parsedOutput.warnings];

        for (const issue of allIssues) {
            const fileUri = issue.filePath ?
                vscode.Uri.file(issue.filePath) :
                fallbackUri;

            if (!fileUri) {
                continue;
            }

            const fileKey = fileUri.fsPath;

            // Create deduplication key
            const line = (issue.line ?? 1) - 1; // Convert to 0-based
            const dedupKey = this.createDiagnosticKey(fileKey, line, issue.message);

            // Skip duplicates
            if (seenDiagnostics.has(dedupKey)) {
                continue;
            }
            seenDiagnostics.add(dedupKey);

            if (!diagnosticsByFile.has(fileKey)) {
                diagnosticsByFile.set(fileKey, []);
            }

            // Create range with reasonable width
            const column = (issue.column ?? 1) - 1;
            const range = new vscode.Range(
                new vscode.Position(Math.max(0, line), Math.max(0, column)),
                new vscode.Position(Math.max(0, line), Math.max(0, column) + DEFAULT_DIAGNOSTIC_RANGE_WIDTH)
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                issue.message,
                issue.severity === 'error' ?
                    vscode.DiagnosticSeverity.Error :
                    vscode.DiagnosticSeverity.Warning
            );

            diagnostic.source = 'DITA-OT';
            diagnostic.code = issue.code !== 'UNKNOWN' ? issue.code : undefined;

            // P0-2 Fix: Safe access to map entry (avoid non-null assertion)
            const fileDiagnostics = diagnosticsByFile.get(fileKey);
            if (fileDiagnostics) {
                fileDiagnostics.push(diagnostic);
            } else {
                diagnosticsByFile.set(fileKey, [diagnostic]);
            }
        }

        // Set diagnostics for each file
        for (const [filePath, diagnostics] of diagnosticsByFile) {
            this.diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
        }

        const duplicatesSkipped = allIssues.length - seenDiagnostics.size;
        logger.debug('Updated DITA-OT diagnostics', {
            fileCount: diagnosticsByFile.size,
            totalDiagnostics: seenDiagnostics.size,
            duplicatesSkipped
        });
    }

    /**
     * Clear all publishing diagnostics
     */
    public clear(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

/**
 * Singleton instance for publishing diagnostics
 */
let diagnosticsInstance: DitaOtDiagnostics | undefined;

/**
 * Get or create the DITA-OT diagnostics instance
 */
export function getDitaOtDiagnostics(): DitaOtDiagnostics {
    if (!diagnosticsInstance) {
        diagnosticsInstance = new DitaOtDiagnostics();
    }
    return diagnosticsInstance;
}

/**
 * Dispose of the diagnostics instance
 */
export function disposeDitaOtDiagnostics(): void {
    if (diagnosticsInstance) {
        diagnosticsInstance.dispose();
        diagnosticsInstance = undefined;
    }
}
