/**
 * DITA-OT Output Channel
 * Provides syntax-highlighted output for DITA-OT build processes
 * Uses VS Code's LogOutputChannel API for automatic colorization
 */

import * as vscode from 'vscode';

/**
 * Patterns for detecting log levels in DITA-OT output
 * Exported for testing purposes
 */
export const LOG_LEVEL_PATTERNS = {
    error: [
        /\[ERROR\]/i,
        /\[FATAL\]/i,
        /\bERROR:/i,
        /\bFATAL:/i,
        /\bSEVERE:/i,
        /Exception\b/,  // Matches "NullPointerException", "Exception", etc.
        /\bfailed\s+(to\s+)?(process|build|transform|publish|compile|load|parse|read|write)\b/i,
        /BUILD FAILED/i,
        /\[DOT[A-Z]\d{3}[EF]\]/  // DITA-OT error codes ending in E or F
    ],
    warning: [
        /\[WARN\]/i,
        /\[WARNING\]/i,
        /\bWARN:/i,
        /\bWARNING:/i,
        /\[DOT[A-Z]\d{3}W\]/  // DITA-OT warning codes ending in W
    ],
    info: [
        /\[INFO\]/i,
        /\bINFO:/i,
        /\[DOT[A-Z]\d{3}I\]/,  // DITA-OT info codes ending in I
        /BUILD SUCCESSFUL/i
    ],
    debug: [
        /\[DEBUG\]/i,
        /\bDEBUG:/i,
        /\[echo\]/i,
        /\[delete\]/i,
        /\[mkdir\]/i,
        /\[copy\]/i,
        /\[move\]/i
    ]
};

/**
 * Patterns for build stages (used for trace-level output)
 * Exported for testing purposes
 */
export const BUILD_STAGE_PATTERNS = [
    /\[pipeline\]/i,
    /\[xslt\]/i,
    /\[java\]/i,
    /\[saxonxslt\]/i
];

/**
 * DitaOtOutputChannel - Manages syntax-highlighted DITA-OT build output
 */
export class DitaOtOutputChannel implements vscode.Disposable {
    private outputChannel: vscode.LogOutputChannel;
    private static instance: DitaOtOutputChannel | undefined;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('DITA-OT Build', { log: true });
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): DitaOtOutputChannel {
        if (!DitaOtOutputChannel.instance) {
            DitaOtOutputChannel.instance = new DitaOtOutputChannel();
        }
        return DitaOtOutputChannel.instance;
    }

    /**
     * Reset the singleton instance (for testing)
     */
    public static resetInstance(): void {
        if (DitaOtOutputChannel.instance) {
            DitaOtOutputChannel.instance.dispose();
            DitaOtOutputChannel.instance = undefined;
        }
    }

    /**
     * Detect the log level of a line based on content patterns
     * Note: Made public for testing purposes
     */
    public detectLogLevel(line: string): 'error' | 'warn' | 'info' | 'debug' | 'trace' {
        // Check error patterns first (highest priority)
        for (const pattern of LOG_LEVEL_PATTERNS.error) {
            if (pattern.test(line)) {
                return 'error';
            }
        }

        // Check warning patterns
        for (const pattern of LOG_LEVEL_PATTERNS.warning) {
            if (pattern.test(line)) {
                return 'warn';
            }
        }

        // Check info patterns
        for (const pattern of LOG_LEVEL_PATTERNS.info) {
            if (pattern.test(line)) {
                return 'info';
            }
        }

        // Check debug patterns (Ant task output)
        for (const pattern of LOG_LEVEL_PATTERNS.debug) {
            if (pattern.test(line)) {
                return 'debug';
            }
        }

        // Check build stage patterns (trace level)
        for (const pattern of BUILD_STAGE_PATTERNS) {
            if (pattern.test(line)) {
                return 'trace';
            }
        }

        // Default to debug for unrecognized lines
        return 'debug';
    }

    /**
     * Log a single line with appropriate level detection
     */
    public logLine(line: string): void {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return;
        }

        const level = this.detectLogLevel(trimmedLine);

        switch (level) {
            case 'error':
                this.outputChannel.error(trimmedLine);
                break;
            case 'warn':
                this.outputChannel.warn(trimmedLine);
                break;
            case 'info':
                this.outputChannel.info(trimmedLine);
                break;
            case 'debug':
                this.outputChannel.debug(trimmedLine);
                break;
            case 'trace':
                this.outputChannel.trace(trimmedLine);
                break;
        }
    }

    /**
     * Log multiple lines (e.g., from stdout/stderr buffer)
     */
    public logOutput(output: string): void {
        const lines = output.split(/\r?\n/);
        for (const line of lines) {
            this.logLine(line);
        }
    }

    /**
     * Format current time for display
     */
    private formatTime(): string {
        return new Date().toLocaleTimeString();
    }

    /**
     * Log a build start message
     */
    public logBuildStart(inputFile: string, transtype: string): void {
        this.outputChannel.info('═'.repeat(60));
        this.outputChannel.info(`DITA-OT Build Started at ${this.formatTime()}`);
        this.outputChannel.info(`Input: ${inputFile}`);
        this.outputChannel.info(`Format: ${transtype}`);
        this.outputChannel.info('═'.repeat(60));
    }

    /**
     * Log a build completion message
     */
    public logBuildComplete(success: boolean, outputPath: string, duration?: number): void {
        this.outputChannel.info('─'.repeat(60));
        if (success) {
            this.outputChannel.info(`BUILD SUCCESSFUL at ${this.formatTime()}`);
            this.outputChannel.info(`Output: ${outputPath}`);
        } else {
            this.outputChannel.error(`BUILD FAILED at ${this.formatTime()}`);
        }
        if (duration !== undefined) {
            this.outputChannel.info(`Duration: ${(duration / 1000).toFixed(1)}s`);
        }
        this.outputChannel.info('═'.repeat(60));
    }

    /**
     * Show the output channel
     */
    public show(preserveFocus: boolean = true): void {
        this.outputChannel.show(preserveFocus);
    }

    /**
     * Clear the output channel
     */
    public clear(): void {
        this.outputChannel.clear();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}

/**
 * Get the DITA-OT output channel singleton
 */
export function getDitaOtOutputChannel(): DitaOtOutputChannel {
    return DitaOtOutputChannel.getInstance();
}

/**
 * Dispose of the DITA-OT output channel
 */
export function disposeDitaOtOutputChannel(): void {
    DitaOtOutputChannel.resetInstance();
}
