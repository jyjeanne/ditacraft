/**
 * DITA Validator
 * Validates DITA files for XML syntax and DITA conformance
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { XMLValidator } from 'fast-xml-parser';
import { DOMParser } from '@xmldom/xmldom';
import { DtdResolver } from '../utils/dtdResolver';
import { getErrorMessage, fireAndForget } from '../utils/errorUtils';

const execFileAsync = promisify(execFile);

export interface ValidationError {
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    source: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export class DitaValidator {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private validationEngine: 'xmllint' | 'built-in';
    private dtdResolver: DtdResolver | null = null;

    constructor(extensionContext?: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('dita');
        this.validationEngine = this.getValidationEngine();

        // Initialize DTD resolver if extension context is provided
        if (extensionContext) {
            this.dtdResolver = new DtdResolver(extensionContext.extensionPath);
        }
    }

    /**
     * Get the configured validation engine
     */
    private getValidationEngine(): 'xmllint' | 'built-in' {
        const config = vscode.workspace.getConfiguration('ditacraft');
        return config.get<'xmllint' | 'built-in'>('validationEngine', 'xmllint');
    }

    /**
     * Validate a DITA file
     */
    public async validateFile(fileUri: vscode.Uri): Promise<ValidationResult> {
        const filePath = fileUri.fsPath;

        // Check file exists and read content once (performance optimization)
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(filePath, 'utf8');
        } catch (_error) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: 'File does not exist or cannot be read',
                    source: 'ditacraft'
                }],
                warnings: []
            };
        }

        // Reload configuration
        this.validationEngine = this.getValidationEngine();

        // Validate based on engine
        let result: ValidationResult;

        if (this.validationEngine === 'xmllint') {
            result = await this.validateWithXmllint(filePath);
        } else {
            result = await this.validateWithBuiltIn(filePath, fileContent);
        }

        // Add DITA-specific validation (pass cached content)
        const ditaValidation = await this.validateDitaStructure(filePath, fileContent);
        result.errors.push(...ditaValidation.errors);
        result.warnings.push(...ditaValidation.warnings);

        // Recalculate validity based on total errors
        result.valid = result.errors.length === 0;

        // Update diagnostics
        this.updateDiagnostics(fileUri, result);

        return result;
    }

    /**
     * Validate using xmllint (external tool)
     */
    private async validateWithXmllint(filePath: string): Promise<ValidationResult> {
        try {
            // Try to run xmllint for basic XML validation
            // We skip --valid flag because DTD files may not be available
            // DITA-specific validation is done separately in validateDitaStructure
            // --noout: don't output the parsed document
            const command = process.platform === 'win32' ? 'xmllint' : 'xmllint';

            // Basic XML well-formedness check without DTD validation
            // Use execFile instead of exec to avoid command injection
            await execFileAsync(command, ['--noout', filePath], {
                cwd: path.dirname(filePath) // Set working directory to file location
            });

            // No errors
            return {
                valid: true,
                errors: [],
                warnings: []
            };

        } catch (error: unknown) {
            const err = error as { code?: string; message?: string; stderr?: string; stdout?: string };

            // Check if xmllint is not installed
            if (err.code === 'ENOENT' || err.message?.includes('not found')) {
                // Fire-and-forget: show warning without blocking validation
                fireAndForget(
                    (async () => {
                        const action = await vscode.window.showWarningMessage(
                            'xmllint not found. Switching to built-in validation. Install libxml2 or change validation engine in settings.',
                            'Change Engine'
                        );
                        if (action === 'Change Engine') {
                            await vscode.commands.executeCommand('workbench.action.openSettings', 'ditacraft.validationEngine');
                        }
                    })(),
                    'xmllint-warning'
                );

                // Fall back to built-in validation
                return this.validateWithBuiltIn(filePath);
            }

            // Check if error is related to missing DTDs (we handle DITA validation separately)
            const stderrOutput = err.stderr || err.stdout || '';
            if (stderrOutput.includes('failed to load external entity') ||
                stderrOutput.includes('Could not load DTD') ||
                stderrOutput.includes('validity error')) {
                // DTD validation issues - fall back to built-in + DITA structure validation
                return this.validateWithBuiltIn(filePath);
            }

            // Parse xmllint errors (real XML syntax errors)
            const errors = this.parseXmllintErrors(stderrOutput);

            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: []
            };
        }
    }

    /**
     * Parse xmllint error output
     */
    private parseXmllintErrors(output: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const lines = output.split('\n');

        // xmllint error format: filename:line:column: type: message
        const errorRegex = /^(.+):(\d+):(\d+):\s*(error|warning|info):\s*(.+)$/;

        for (const line of lines) {
            const match = line.match(errorRegex);
            if (match) {
                errors.push({
                    line: parseInt(match[2], 10) - 1, // VS Code uses 0-based line numbers
                    column: parseInt(match[3], 10) - 1,
                    severity: match[4] as 'error' | 'warning' | 'info',
                    message: match[5].trim(),
                    source: 'xmllint'
                });
            }
        }

        return errors;
    }

    /**
     * Validate using built-in XML parser
     */
    private async validateWithBuiltIn(filePath: string, content?: string): Promise<ValidationResult> {
        try {
            // Use provided content or read file (fallback for backward compatibility)
            const fileContent = content || await fsPromises.readFile(filePath, 'utf8');

            // Try DTD validation if DTD resolver is available
            if (this.dtdResolver && this.dtdResolver.areDtdsAvailable()) {
                const dtdResult = await this.validateWithDtd(filePath, fileContent);
                // If DTD validation found errors, return those
                if (dtdResult.errors.length > 0) {
                    return dtdResult;
                }
            }

            // First, use the validate method to check for XML errors
            const validationResult = XMLValidator.validate(fileContent, {
                allowBooleanAttributes: true
            });

            if (validationResult !== true) {
                // Validation failed - safely extract error details
                const errorObj = validationResult as Record<string, unknown>;
                const err = errorObj.err as Record<string, unknown> | undefined;

                // Validate the error object structure before accessing properties
                const errorCode = err && typeof err.code === 'string' ? err.code : 'UNKNOWN';
                const errorMsg = err && typeof err.msg === 'string' ? err.msg : 'Validation error';
                const errorLine = err && typeof err.line === 'number' ? err.line : 1;

                return {
                    valid: false,
                    errors: [{
                        line: errorLine - 1,
                        column: 0,
                        severity: 'error',
                        message: `${errorCode}: ${errorMsg}`,
                        source: 'xml-parser'
                    }],
                    warnings: []
                };
            }

            // Basic XML is valid
            return {
                valid: true,
                errors: [],
                warnings: []
            };

        } catch (error: unknown) {
            // Parse error from fast-xml-parser
            const errorMessage = getErrorMessage(error);

            // Try to extract line number from error message
            const lineMatch = errorMessage.match(/line:(\d+)/i) ||
                             errorMessage.match(/at position (\d+)/i);
            const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;

            return {
                valid: false,
                errors: [{
                    line: line,
                    column: 0,
                    severity: 'error',
                    message: errorMessage,
                    source: 'xml-parser'
                }],
                warnings: []
            };
        }
    }

    /**
     * Validate using DTD with xmldom
     */
    private async validateWithDtd(_filePath: string, content: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        try {
            // Custom error handler to collect errors
            const errorHandler = {
                warning: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    warnings.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'warning',
                        source: 'dtd-validator'
                    });
                },
                error: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    errors.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'error',
                        source: 'dtd-validator'
                    });
                },
                fatalError: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    errors.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'error',
                        source: 'dtd-validator'
                    });
                }
            };

            // Neutralize XXE attacks before parsing
            const { content: safeContent, hadEntities } = this.neutralizeXXE(content);
            if (hadEntities) {
                warnings.push({
                    line: 0,
                    column: 0,
                    message: 'External entity declarations were removed for security reasons',
                    severity: 'warning',
                    source: 'security'
                });
            }

            // Create parser with DTD validation
            const parser = new DOMParser({
                errorHandler,
                locator: {}
            });

            // Parse XML (xmldom will automatically validate against DTD if present)
            parser.parseFromString(safeContent, 'text/xml');

            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: warnings
            };

        } catch (error: unknown) {
            // Handle parsing errors
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: `DTD validation error: ${getErrorMessage(error)}`,
                source: 'dtd-validator'
            });

            return {
                valid: false,
                errors: errors,
                warnings: warnings
            };
        }
    }

    /**
     * Neutralize XXE (XML External Entity) attacks by removing entity declarations
     * This prevents malicious XML from accessing local files or causing SSRF
     */
    private neutralizeXXE(xmlContent: string): { content: string; hadEntities: boolean } {
        // Check for ENTITY declarations in DOCTYPE
        const entityPattern = /<!ENTITY\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi;
        const hadEntities = entityPattern.test(xmlContent);

        if (hadEntities) {
            // Remove external entity declarations while preserving the rest of DOCTYPE
            // This pattern matches: <!ENTITY name SYSTEM "uri"> or <!ENTITY name PUBLIC "..." "...">
            const neutralized = xmlContent.replace(
                /<!ENTITY\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi,
                '<!-- XXE entity declaration removed for security -->'
            );

            // Also remove any parameter entity declarations
            const finalContent = neutralized.replace(
                /<!ENTITY\s+%\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi,
                '<!-- XXE parameter entity declaration removed for security -->'
            );

            return { content: finalContent, hadEntities: true };
        }

        return { content: xmlContent, hadEntities: false };
    }

    /**
     * Extract line and column info from error messages
     */
    private extractLineInfo(message: string): { line: number; column: number } {
        // Extract line and column from error messages
        // Format examples: "@#[line:5,col:10]" or "line 5" or "line:5,col:10"
        const lineMatch = message.match(/line[:\s]+(\d+)/i);
        const colMatch = message.match(/col(?:umn)?[:\s]+(\d+)/i);

        return {
            line: lineMatch ? Math.max(0, parseInt(lineMatch[1], 10) - 1) : 0,
            column: colMatch ? Math.max(0, parseInt(colMatch[1], 10) - 1) : 0
        };
    }

    /**
     * Clean error messages to make them more user-friendly
     */
    private cleanErrorMessage(message: string): string {
        // Remove technical prefixes and make error messages more user-friendly
        return message
            .replace(/^\[xmldom\s+\w+\]\s*/i, '')
            .replace(/@#\[line:\d+,col:\d+\]/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Validate DITA-specific structure and rules
     */
    private async validateDitaStructure(filePath: string, content?: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        try {
            // Use provided content or read file (fallback for backward compatibility)
            const fileContent = content || await fsPromises.readFile(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            // Check DOCTYPE declaration
            if (!fileContent.includes('<!DOCTYPE')) {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: 'Missing DOCTYPE declaration',
                    source: 'dita-validator'
                });
            }

            // Validate based on file type
            try {
                if (ext === '.dita') {
                    this.validateDitaTopic(fileContent, errors, warnings);
                } else if (ext === '.ditamap') {
                    this.validateDitaMap(fileContent, errors, warnings);
                } else if (ext === '.bookmap') {
                    this.validateBookmap(fileContent, errors, warnings);
                }

                // Check for common DITA issues
                this.checkCommonIssues(fileContent, errors, warnings);
            } catch (validationError: unknown) {
                // Ignore validation errors in structure checking
                // These are often false positives from simple string matching
                console.log('DITA structure validation error (ignored):', validationError);
            }

        } catch (fileError: unknown) {
            // File reading error - add as error
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: `Failed to read file for DITA validation: ${getErrorMessage(fileError)}`,
                source: 'dita-validator'
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate DITA topic structure
     */
    private validateDitaTopic(content: string, errors: ValidationError[], _warnings: ValidationError[]): void {
        // Check for root element (topic, concept, task, reference, etc.)
        const topicTypes = ['<topic', '<concept', '<task', '<reference'];
        const hasTopicRoot = topicTypes.some(type => content.includes(type));

        if (!hasTopicRoot) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic must have a valid root element (topic, concept, task, or reference)',
                source: 'dita-validator'
            });
        }

        // Check for id attribute on root (REQUIRED per DITA DTD)
        const idMatch = content.match(/<(?:topic|concept|task|reference)\s+[^>]*id="([^"]*)"/);
        if (!idMatch) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element MUST have an id attribute (required by DTD)',
                source: 'dita-validator'
            });
        } else if (idMatch.length > 1 && idMatch[1] === '') {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element id attribute cannot be empty',
                source: 'dita-validator'
            });
        }

        // Check for required title element as DIRECT CHILD of root (MANDATORY per DITA DTD)
        // The title must appear immediately after the opening tag of topic/concept/task/reference
        // Pattern: <topic ...> followed by optional whitespace/comments, then <title>
        const rootTitlePattern = /<(?:topic|concept|task|reference)\s+[^>]*>[\s\S]*?(?=<(?:title|shortdesc|prolog|abstract|body|conbody|taskbody|refbody|related-links))/;
        const rootMatch = content.match(rootTitlePattern);

        if (rootMatch) {
            // Now check if there's a <title> element that's a direct child of the root
            // We need to find <title> that comes right after the root element opening tag
            const titleAfterRootPattern = /<(?:topic|concept|task|reference)\s+[^>]*>[\s]*<title>/;
            const hasRootTitle = titleAfterRootPattern.test(content);

            if (!hasRootTitle) {
                // Double-check: look for title as first child element
                const firstChildPattern = /<(?:topic|concept|task|reference)\s+[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*<(\w+)/;
                const firstChildMatch = content.match(firstChildPattern);

                if (!firstChildMatch || firstChildMatch[1] !== 'title') {
                    errors.push({
                        line: 0,
                        column: 0,
                        severity: 'error',
                        message: 'DITA topic MUST contain a <title> element as first child (required by DTD)',
                        source: 'dita-validator'
                    });
                }
            }
        } else {
            // Fallback: Simple check if no title exists at all
            if (!content.includes('<title>') && !content.includes('<title ')) {
                errors.push({
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: 'DITA topic MUST contain a <title> element (required by DTD)',
                    source: 'dita-validator'
                });
            }
        }

        // Check for empty title element (anywhere in document as it's always invalid)
        const emptyTitlePattern = /<title\s*(?:\/|>\s*<\/title)>/;
        if (emptyTitlePattern.test(content)) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic <title> element cannot be empty (required by DTD)',
                source: 'dita-validator'
            });
        }
    }

    /**
     * Validate DITA map structure
     */
    private validateDitaMap(content: string, errors: ValidationError[], warnings: ValidationError[]): void {
        // Check for map root element
        if (!content.includes('<map')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA map must have a <map> root element',
                source: 'dita-validator'
            });
        }

        // Check for title
        if (!content.includes('<title>')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'DITA map should contain a <title> element',
                source: 'dita-validator'
            });
        }

        // Check topicref elements have href
        const topicrefMatches = content.matchAll(/<topicref([^>]*)>/g);
        for (const match of topicrefMatches) {
            if (!match[1].includes('href=')) {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: '<topicref> should have an href attribute',
                    source: 'dita-validator'
                });
            }
        }
    }

    /**
     * Validate bookmap structure
     */
    private validateBookmap(content: string, errors: ValidationError[], warnings: ValidationError[]): void {
        // Check for bookmap root element
        if (!content.includes('<bookmap')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Bookmap must have a <bookmap> root element',
                source: 'dita-validator'
            });
        }

        // Check for booktitle
        if (!content.includes('<booktitle>')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Bookmap should contain a <booktitle> element',
                source: 'dita-validator'
            });
        }

        // Check for mainbooktitle
        if (!content.includes('<mainbooktitle>')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Bookmap should contain a <mainbooktitle> element',
                source: 'dita-validator'
            });
        }
    }

    /**
     * Check for common DITA issues
     */
    private checkCommonIssues(content: string, _errors: ValidationError[], warnings: ValidationError[]): void {
        // Check for empty elements that should have content
        const emptyElements = [
            '<title></title>',
            '<p></p>',
            '<shortdesc></shortdesc>'
        ];

        for (const element of emptyElements) {
            if (content.includes(element)) {
                const elementName = element.match(/<(\w+)>/)?.[1];
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: `Empty <${elementName}> element should be removed or filled with content`,
                    source: 'dita-validator'
                });
            }
        }

        // Check for missing closing tags (basic check)
        const openTags = content.match(/<(\w+)[^/>]*>/g) || [];
        const closeTags = content.match(/<\/(\w+)>/g) || [];

        if (openTags.length > closeTags.length + 5) { // Allow for self-closing tags
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Possible unclosed tags detected. Verify all elements are properly closed.',
                source: 'dita-validator'
            });
        }
    }

    /**
     * Update VS Code diagnostics
     */
    private updateDiagnostics(fileUri: vscode.Uri, result: ValidationResult): void {
        const diagnostics: vscode.Diagnostic[] = [];

        // Add errors
        for (const error of result.errors) {
            const range = new vscode.Range(
                new vscode.Position(error.line, error.column),
                new vscode.Position(error.line, error.column + 100) // Highlight line
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                error.message,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = error.source;
            diagnostics.push(diagnostic);
        }

        // Add warnings
        for (const warning of result.warnings) {
            const range = new vscode.Range(
                new vscode.Position(warning.line, warning.column),
                new vscode.Position(warning.line, warning.column + 100)
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                warning.message,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = warning.source;
            diagnostics.push(diagnostic);
        }

        this.diagnosticCollection.set(fileUri, diagnostics);
    }

    /**
     * Clear diagnostics for a file
     */
    public clearDiagnostics(fileUri: vscode.Uri): void {
        this.diagnosticCollection.delete(fileUri);
    }

    /**
     * Clear all diagnostics
     */
    public clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose validator resources
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
