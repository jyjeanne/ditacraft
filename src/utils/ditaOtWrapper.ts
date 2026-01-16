/**
 * DITA-OT Wrapper
 * Handles DITA-OT installation detection, configuration, and command execution
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';
import { getDitaOtOutputChannel } from './ditaOtOutputChannel';

const execFileAsync = promisify(execFile);

export interface DitaOtConfig {
    ditaOtPath: string;
    defaultTranstype: string;
    outputDirectory: string;
    additionalArgs: string[];
}

export interface PublishOptions {
    inputFile: string;
    transtype: string;
    outputDir: string;
    tempDir?: string;
    additionalArgs?: string[];
}

export interface PublishProgress {
    stage: string;
    percentage: number;
    message: string;
}

export interface PublishResult {
    success: boolean;
    outputPath: string;
    error?: string;
    /** Combined stdout and stderr output for error parsing */
    output?: string;
}

export class DitaOtWrapper {
    private config: DitaOtConfig;
    private ditaOtCommand: string = '';

    constructor() {
        this.config = this.loadConfiguration();
        this.ditaOtCommand = this.detectDitaOtCommand();
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfiguration(): DitaOtConfig {
        const config = vscode.workspace.getConfiguration('ditacraft');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

        let outputDir = config.get<string>('outputDirectory', '${workspaceFolder}/out');
        outputDir = outputDir.replace('${workspaceFolder}', workspaceFolder);

        // Validate output directory path
        if (outputDir && !this.isValidPath(outputDir)) {
            logger.warn('Invalid output directory path, using default');
            outputDir = workspaceFolder ? path.join(workspaceFolder, 'out') : './out';
        }

        // Validate DITA-OT path
        const ditaOtPath = config.get<string>('ditaOtPath', '');
        if (ditaOtPath && !this.isValidPath(ditaOtPath)) {
            logger.warn('Invalid DITA-OT path in configuration');
        }

        // Validate transtype
        const defaultTranstype = config.get<string>('defaultTranstype', 'html5');
        const validTranstypes = ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
        const safeTranstype = validTranstypes.includes(defaultTranstype) ? defaultTranstype : 'html5';

        return {
            ditaOtPath: ditaOtPath,
            defaultTranstype: safeTranstype,
            outputDirectory: outputDir,
            additionalArgs: config.get<string[]>('ditaOtArgs', [])
        };
    }

    /**
     * Get DITA-OT process timeout from configuration (in milliseconds)
     */
    private getProcessTimeoutMs(): number {
        const config = vscode.workspace.getConfiguration('ditacraft');
        const timeoutMinutes = config.get<number>('ditaOtTimeoutMinutes', 10);
        return timeoutMinutes * 60 * 1000;
    }

    /**
     * Validate that a path doesn't contain dangerous characters
     */
    private isValidPath(pathStr: string): boolean {
        // Check for null bytes (security risk)
        if (pathStr.includes('\0')) {
            return false;
        }

        // Check for reserved characters that could cause issues
        const invalidChars = /[<>:"|?*]/;
        if (process.platform === 'win32' && invalidChars.test(pathStr)) {
            // On Windows, these characters are invalid in paths
            // But we allow : for drive letters (e.g., C:\)
            const withoutDrive = pathStr.replace(/^[a-zA-Z]:/, '');
            if (/[<>"|?*]/.test(withoutDrive)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reload configuration (call when settings change)
     */
    public reloadConfiguration(): void {
        this.config = this.loadConfiguration();
        this.ditaOtCommand = this.detectDitaOtCommand();
    }

    /**
     * Detect DITA-OT command based on platform and configuration
     */
    private detectDitaOtCommand(): string {
        const platform = process.platform;
        let ditaCommand = '';

        // If user specified a custom DITA-OT path
        if (this.config.ditaOtPath) {
            const binPath = path.join(this.config.ditaOtPath, 'bin');

            if (platform === 'win32') {
                ditaCommand = path.join(binPath, 'dita.bat');
                // Also check for dita.cmd
                if (!fs.existsSync(ditaCommand)) {
                    ditaCommand = path.join(binPath, 'dita.cmd');
                }
            } else {
                ditaCommand = path.join(binPath, 'dita');
            }

            // Verify the command exists
            if (!fs.existsSync(ditaCommand)) {
                vscode.window.showWarningMessage(
                    `DITA-OT command not found at: ${ditaCommand}. Please check your ditacraft.ditaOtPath setting.`
                );
                return '';
            }

            return ditaCommand;
        }

        // Try to find DITA-OT in system PATH
        if (platform === 'win32') {
            ditaCommand = 'dita.bat';
        } else {
            ditaCommand = 'dita';
        }

        return ditaCommand;
    }

    /**
     * Verify DITA-OT installation and get version
     */
    public async verifyInstallation(): Promise<{ installed: boolean; version?: string; path?: string }> {
        try {
            const command = this.ditaOtCommand || 'dita';
            let stdout: string;

            // On Windows, .bat and .cmd files need to be executed through cmd.exe
            if (process.platform === 'win32' && (command.endsWith('.bat') || command.endsWith('.cmd'))) {
                const result = await execFileAsync('cmd.exe', ['/c', command, '--version']);
                stdout = result.stdout;
            } else {
                const result = await execFileAsync(command, ['--version']);
                stdout = result.stdout;
            }

            const versionMatch = stdout.match(/DITA-OT version ([\d.]+)/i);
            const version = versionMatch ? versionMatch[1] : 'unknown';

            return {
                installed: true,
                version: version,
                path: this.ditaOtCommand || 'System PATH'
            };
        } catch (_error) {
            logger.debug('DITA-OT verification failed', { error: _error });
            return {
                installed: false
            };
        }
    }

    /**
     * Get list of available transtypes from DITA-OT
     */
    public async getAvailableTranstypes(): Promise<string[]> {
        try {
            const command = this.ditaOtCommand || 'dita';
            let stdout: string;

            // On Windows, .bat and .cmd files need to be executed through cmd.exe
            if (process.platform === 'win32' && (command.endsWith('.bat') || command.endsWith('.cmd'))) {
                const result = await execFileAsync('cmd.exe', ['/c', command, 'transtypes']);
                stdout = result.stdout;
            } else {
                const result = await execFileAsync(command, ['transtypes']);
                stdout = result.stdout;
            }

            // Parse the output to extract transtype names
            const transtypes: string[] = [];
            const lines = stdout.split('\n');

            for (const line of lines) {
                // Look for lines that start with transtype names (typically indented)
                const match = line.trim().match(/^(\w+)\s+-/);
                if (match) {
                    transtypes.push(match[1]);
                }
            }

            // Return default list if parsing failed
            if (transtypes.length === 0) {
                return ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
            }

            return transtypes.sort();
        } catch (_error) {
            // Return default transtypes if command fails
            return ['html5', 'pdf', 'xhtml', 'epub', 'htmlhelp', 'markdown'];
        }
    }

    /**
     * Publish DITA content using DITA-OT
     */
    public async publish(
        options: PublishOptions,
        progressCallback?: (progress: PublishProgress) => void
    ): Promise<PublishResult> {

        logger.debug('Publishing with options', {
            inputFile: options.inputFile,
            transtype: options.transtype,
            outputDir: options.outputDir
        });

        return new Promise((resolve) => {
            const command = this.ditaOtCommand || 'dita';

            // Normalize paths on Windows to avoid DOTJ083E errors (drive letter case)
            const normalizedInputFile = this.normalizeFilePath(options.inputFile);
            const normalizedOutputDir = this.normalizeFilePath(options.outputDir);

            // Build command arguments
            // Note: Pass arguments as array elements without quotes - spawn handles escaping
            const args: string[] = [
                '--input', normalizedInputFile,
                '--format', options.transtype,
                '--output', normalizedOutputDir,
                // Add verbose mode for better error messages
                '--verbose',
                // Force overwrite of existing output and clean temp files
                '--clean.temp=yes'
            ];

            logger.info('DITA-OT command', { command, args: args.join(' ') });

            // Add temp directory if specified
            if (options.tempDir) {
                args.push('--temp', options.tempDir);
            }

            // Add additional arguments
            if (options.additionalArgs && options.additionalArgs.length > 0) {
                args.push(...options.additionalArgs);
            }

            // Add global additional arguments from config
            if (this.config.additionalArgs.length > 0) {
                args.push(...this.config.additionalArgs);
            }

            // Report initial progress
            if (progressCallback) {
                progressCallback({
                    stage: 'Starting',
                    percentage: 0,
                    message: 'Initializing DITA-OT...'
                });
            }

            // Final validation before spawning process
            if (!fs.existsSync(options.inputFile)) {
                logger.error('Input file does not exist', { inputFile: options.inputFile });
                resolve({
                    success: false,
                    outputPath: options.outputDir,
                    error: `Input file does not exist: ${options.inputFile}`
                });
                return;
            }

            const inputStats = fs.statSync(options.inputFile);
            if (inputStats.isDirectory()) {
                logger.error('Input path is a directory, not a file', { inputFile: options.inputFile });
                resolve({
                    success: false,
                    outputPath: options.outputDir,
                    error: `Input path is a directory, not a file: ${options.inputFile}`
                });
                return;
            }

            logger.debug('Input file validated successfully');

            // Get the DITA-OT output channel for syntax-highlighted output (before spawn)
            const ditaOtOutput = getDitaOtOutputChannel();
            ditaOtOutput.clear();
            ditaOtOutput.logBuildStart(options.inputFile, options.transtype);
            ditaOtOutput.show(true);

            // Spawn DITA-OT process
            // On Windows, .bat and .cmd files need to be executed through cmd.exe
            // Set DITA_HOME environment variable for proper DITA-OT execution
            const ditaHome = this.config.ditaOtPath || '';
            const processEnv = { ...process.env };
            if (ditaHome) {
                processEnv['DITA_HOME'] = ditaHome;
            }

            const normalizedCwd = this.normalizeFilePath(path.dirname(options.inputFile));

            logger.info('Spawning DITA-OT process', {
                cwd: normalizedCwd,
                ditaHome: ditaHome || 'not set (using system PATH)'
            });

            const buildStartTime = Date.now();
            let ditaProcess;
            if (process.platform === 'win32' && (command.endsWith('.bat') || command.endsWith('.cmd'))) {
                // Execute through cmd.exe for Windows batch files
                ditaProcess = spawn('cmd.exe', ['/c', command, ...args], {
                    cwd: normalizedCwd,
                    env: processEnv
                });
            } else {
                ditaProcess = spawn(command, args, {
                    cwd: normalizedCwd,
                    env: processEnv
                });
            }

            let outputBuffer = '';
            let errorBuffer = '';
            let processTimedOut = false;

            // Add timeout protection for DITA-OT processing
            const processTimeoutMs = this.getProcessTimeoutMs();
            const timeoutMinutes = processTimeoutMs / 60000;
            const timeoutHandle = setTimeout(() => {
                processTimedOut = true;
                logger.error(`DITA-OT process timeout after ${timeoutMinutes} minutes`);
                ditaProcess.kill('SIGTERM');

                // Give it a moment to terminate gracefully, then force kill
                setTimeout(() => {
                    if (!ditaProcess.killed) {
                        ditaProcess.kill('SIGKILL');
                    }
                }, 5000);
            }, processTimeoutMs);

            // Capture stdout
            ditaProcess.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                outputBuffer += output;

                // Log to syntax-highlighted output channel
                ditaOtOutput.logOutput(output);

                // Also log to main logger for file logging
                logger.debug('DITA-OT stdout', { output: output.trim() });

                // Parse progress from output
                if (progressCallback) {
                    const progress = this.parseProgress(output);
                    if (progress) {
                        progressCallback(progress);
                    }
                }
            });

            // Capture stderr
            ditaProcess.stderr?.on('data', (data: Buffer) => {
                const error = data.toString();
                errorBuffer += error;

                // Log to syntax-highlighted output channel (level detection is automatic)
                ditaOtOutput.logOutput(error);

                // Also log to main logger for file logging
                const trimmedError = error.trim();
                if (trimmedError) {
                    logger.debug('DITA-OT stderr', { output: trimmedError });
                }

                // DITA-OT sometimes outputs progress to stderr
                if (progressCallback) {
                    const progress = this.parseProgress(error);
                    if (progress) {
                        progressCallback(progress);
                    }
                }
            });

            // Handle process completion
            ditaProcess.on('close', (code: number) => {
                // Clear the timeout since process has completed
                clearTimeout(timeoutHandle);

                const buildDuration = Date.now() - buildStartTime;
                logger.debug('DITA-OT process closed', { exitCode: code, durationMs: buildDuration });

                // Combine output for error parsing
                const combinedOutput = outputBuffer + '\n' + errorBuffer;

                if (processTimedOut) {
                    ditaOtOutput.logBuildComplete(false, options.outputDir, buildDuration);
                    resolve({
                        success: false,
                        outputPath: options.outputDir,
                        error: `DITA-OT process timed out after ${timeoutMinutes} minutes`,
                        output: combinedOutput
                    });
                } else if (code === 0) {
                    if (progressCallback) {
                        progressCallback({
                            stage: 'Complete',
                            percentage: 100,
                            message: 'Publishing completed successfully'
                        });
                    }

                    ditaOtOutput.logBuildComplete(true, options.outputDir, buildDuration);
                    logger.info('Publishing successful', { outputPath: options.outputDir });
                    resolve({
                        success: true,
                        outputPath: options.outputDir,
                        output: combinedOutput
                    });
                } else {
                    ditaOtOutput.logBuildComplete(false, options.outputDir, buildDuration);
                    logger.error('Publishing failed', {
                        exitCode: code,
                        errorOutput: errorBuffer,
                        standardOutput: outputBuffer
                    });

                    resolve({
                        success: false,
                        outputPath: options.outputDir,
                        error: errorBuffer || 'DITA-OT process failed with code ' + code,
                        output: combinedOutput
                    });
                }
            });

            // Handle process errors
            ditaProcess.on('error', (error: Error) => {
                clearTimeout(timeoutHandle);
                resolve({
                    success: false,
                    outputPath: options.outputDir,
                    error: `Failed to start DITA-OT: ${error.message}`,
                    output: errorBuffer || ''
                });
            });
        });
    }

    /**
     * Parse progress information from DITA-OT output
     */
    private parseProgress(output: string): PublishProgress | null {
        // DITA-OT output patterns for different stages
        const patterns = [
            { regex: /\[echo\]\s*(.+?)$/m, stage: 'Processing', percentage: 10 },
            { regex: /\[pipeline\]\s*(.+?)$/m, stage: 'Pipeline', percentage: 30 },
            { regex: /\[xslt\]\s*Processing/i, stage: 'Transforming', percentage: 50 },
            { regex: /\[move\]\s*Moving/i, stage: 'Finalizing', percentage: 80 },
            { regex: /BUILD SUCCESSFUL/i, stage: 'Complete', percentage: 100 }
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(output)) {
                const match = output.match(pattern.regex);
                return {
                    stage: pattern.stage,
                    percentage: pattern.percentage,
                    message: match ? match[1]?.trim() || pattern.stage : pattern.stage
                };
            }
        }

        return null;
    }

    /**
     * Get the configured output directory
     */
    public getOutputDirectory(): string {
        return this.config.outputDirectory;
    }

    /**
     * Get the default transtype
     */
    public getDefaultTranstype(): string {
        return this.config.defaultTranstype;
    }

    /**
     * Open configuration dialog to set DITA-OT path
     */
    public async configureOtPath(): Promise<void> {
        const currentPath = this.config.ditaOtPath;

        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Select DITA-OT Directory',
            title: 'Select DITA-OT Installation Directory'
        };

        if (currentPath) {
            options.defaultUri = vscode.Uri.file(currentPath);
        }

        const folderUri = await vscode.window.showOpenDialog(options);

        if (folderUri && folderUri[0]) {
            const selectedPath = folderUri[0].fsPath;

            // Verify this is a valid DITA-OT directory
            const binPath = path.join(selectedPath, 'bin');
            if (!fs.existsSync(binPath)) {
                vscode.window.showErrorMessage(
                    'Invalid DITA-OT directory. The selected folder must contain a "bin" subdirectory.'
                );
                return;
            }

            // Update configuration
            const config = vscode.workspace.getConfiguration('ditacraft');
            await config.update('ditaOtPath', selectedPath, vscode.ConfigurationTarget.Global);

            // Reload configuration
            this.reloadConfiguration();

            // Verify installation
            const verification = await this.verifyInstallation();
            if (verification.installed) {
                vscode.window.showInformationMessage(
                    `DITA-OT configured successfully! Version: ${verification.version}`
                );
            } else {
                vscode.window.showWarningMessage(
                    'DITA-OT path set, but verification failed. Please check the installation.'
                );
            }
        }
    }

    /**
     * Normalize file path for DITA-OT
     * On Windows, ensures drive letter is uppercase to avoid DOTJ083E errors
     */
    private normalizeFilePath(filePath: string): string {
        if (process.platform === 'win32' && filePath.length >= 2 && filePath[1] === ':') {
            // Uppercase the drive letter on Windows
            return filePath[0].toUpperCase() + filePath.slice(1);
        }
        return filePath;
    }

    /**
     * Validate input file is suitable for publishing
     */
    public validateInputFile(filePath: string): { valid: boolean; error?: string } {
        logger.debug('Validating input file', { filePath });

        // Check if path is empty or just whitespace
        if (!filePath || filePath.trim() === '') {
            return { valid: false, error: 'File path is empty' };
        }

        // Check if path ends with directory separator (definitely a directory)
        if (filePath.endsWith('\\') || filePath.endsWith('/')) {
            return { valid: false, error: `Path ends with directory separator: ${filePath}` };
        }

        // Check file exists
        if (!fs.existsSync(filePath)) {
            return { valid: false, error: `File does not exist: ${filePath}` };
        }

        // Check if path is a directory
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            return { valid: false, error: `Path is a directory (not a file): ${filePath}. Please select a DITA file (.dita, .ditamap, or .bookmap)` };
        }

        // Check file extension
        const ext = path.extname(filePath).toLowerCase();
        const validExtensions = ['.dita', '.ditamap', '.bookmap'];

        if (!validExtensions.includes(ext)) {
            return {
                valid: false,
                error: `Invalid file type '${ext}' for file: ${filePath}. Expected ${validExtensions.join(', ')}`
            };
        }

        logger.debug('File validation passed', { filePath });
        return { valid: true };
    }
}
