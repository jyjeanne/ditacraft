import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logFilePath: string;
    private logLevel: LogLevel;
    private enableFileLogging: boolean;
    private enableConsoleLogging: boolean;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('DitaCraft');

        // Get log file path from workspace or use temp directory
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const logDir = workspaceFolder
            ? path.join(workspaceFolder.uri.fsPath, '.ditacraft')
            : path.join(os.tmpdir(), 'ditacraft-logs');

        // Create log directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (error) {
                console.error('Failed to create log directory:', error);
            }
        }

        // Generate log file name with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        this.logFilePath = path.join(logDir, `ditacraft-${timestamp}.log`);

        // Get configuration
        const config = vscode.workspace.getConfiguration('ditacraft');
        this.logLevel = this.parseLogLevel(config.get<string>('logLevel', 'info'));
        this.enableFileLogging = config.get<boolean>('enableFileLogging', true);
        this.enableConsoleLogging = config.get<boolean>('enableConsoleLogging', true);

        // Log initialization
        this.info('Logger initialized', {
            logFilePath: this.logFilePath,
            logLevel: LogLevel[this.logLevel],
            enableFileLogging: this.enableFileLogging,
            enableConsoleLogging: this.enableConsoleLogging
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private parseLogLevel(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'debug': return LogLevel.DEBUG;
            case 'info': return LogLevel.INFO;
            case 'warn': return LogLevel.WARN;
            case 'error': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const levelStr = LogLevel[level].padEnd(5);
        let formatted = `[${timestamp}] [${levelStr}] ${message}`;

        if (data !== undefined) {
            try {
                if (data instanceof Error) {
                    formatted += `\n  Error: ${data.message}`;
                    if (data.stack) {
                        formatted += `\n  Stack: ${data.stack}`;
                    }
                } else if (typeof data === 'object') {
                    formatted += `\n  Data: ${JSON.stringify(data, null, 2)}`;
                } else {
                    formatted += `\n  Data: ${data}`;
                }
            } catch (error) {
                formatted += `\n  Data: [Unable to serialize: ${error}]`;
            }
        }

        return formatted;
    }

    private writeToFile(message: string): void {
        if (!this.enableFileLogging) {
            return;
        }

        try {
            fs.appendFileSync(this.logFilePath, message + '\n', 'utf8');
        } catch (error) {
            // Fallback to console if file writing fails
            console.error('Failed to write to log file:', error);
            console.log(message);
        }
    }

    private writeToConsole(message: string): void {
        if (!this.enableConsoleLogging) {
            return;
        }

        this.outputChannel.appendLine(message);
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (level < this.logLevel) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, data);

        // Always write to console.error for errors (as fallback)
        if (level === LogLevel.ERROR) {
            console.error(formattedMessage);
        } else if (level === LogLevel.WARN) {
            console.warn(formattedMessage);
        } else {
            console.log(formattedMessage);
        }

        this.writeToFile(formattedMessage);
        this.writeToConsole(formattedMessage);
    }

    public debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    public warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    public error(message: string, error?: any): void {
        this.log(LogLevel.ERROR, message, error);
    }

    public show(): void {
        this.outputChannel.show();
    }

    public clear(): void {
        this.outputChannel.clear();
    }

    public getLogFilePath(): string {
        return this.logFilePath;
    }

    public openLogFile(): void {
        if (fs.existsSync(this.logFilePath)) {
            vscode.workspace.openTextDocument(this.logFilePath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        } else {
            vscode.window.showWarningMessage('Log file does not exist yet.');
        }
    }

    public showLogFileLocation(): void {
        vscode.window.showInformationMessage(
            `Log file: ${this.logFilePath}`,
            'Open Log File',
            'Open Folder'
        ).then(selection => {
            if (selection === 'Open Log File') {
                this.openLogFile();
            } else if (selection === 'Open Folder') {
                const logDir = path.dirname(this.logFilePath);
                vscode.env.openExternal(vscode.Uri.file(logDir));
            }
        });
    }

    public async clearOldLogs(daysToKeep: number = 7): Promise<void> {
        const logDir = path.dirname(this.logFilePath);

        if (!fs.existsSync(logDir)) {
            return;
        }

        try {
            const files = fs.readdirSync(logDir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

            let deletedCount = 0;
            for (const file of files) {
                if (!file.startsWith('ditacraft-') || !file.endsWith('.log')) {
                    continue;
                }

                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtime.getTime();

                if (age > maxAge && filePath !== this.logFilePath) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                this.info(`Cleaned up ${deletedCount} old log file(s)`);
            }
        } catch (error) {
            this.error('Failed to clean up old logs', error);
        }
    }

    public dispose(): void {
        this.info('Logger disposing');
        this.outputChannel.dispose();
    }
}

// Export singleton instance
export const logger = Logger.getInstance();
