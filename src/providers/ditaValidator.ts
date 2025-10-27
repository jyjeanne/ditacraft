/**
 * DITA Validator
 * Validates DITA files for XML syntax and DITA conformance
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { XMLParser } from 'fast-xml-parser';

const execAsync = promisify(exec);

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

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('dita');
        this.validationEngine = this.getValidationEngine();
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

        // Check file exists
        if (!fs.existsSync(filePath)) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: 'File does not exist',
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
            result = await this.validateWithBuiltIn(filePath);
        }

        // Add DITA-specific validation
        const ditaValidation = await this.validateDitaStructure(filePath);
        result.errors.push(...ditaValidation.errors);
        result.warnings.push(...ditaValidation.warnings);

        // Update diagnostics
        this.updateDiagnostics(fileUri, result);

        return result;
    }

    /**
     * Validate using xmllint (external tool)
     */
    private async validateWithXmllint(filePath: string): Promise<ValidationResult> {
        try {
            // Try to run xmllint with DTD validation
            // --valid: validate against DTD
            // --noout: don't output the parsed document
            // --nonet: prevent network access for DTD fetching (use local catalog)
            const command = process.platform === 'win32' ? 'xmllint' : 'xmllint';

            // Use --valid to validate against the DOCTYPE declaration (DTD)
            await execAsync(`"${command}" --valid --noout --nonet "${filePath}"`, {
                cwd: path.dirname(filePath) // Set working directory to file location
            });

            // No errors
            return {
                valid: true,
                errors: [],
                warnings: []
            };

        } catch (error: any) {
            // Check if xmllint is not installed
            if (error.code === 'ENOENT' || error.message.includes('not found')) {
                vscode.window.showWarningMessage(
                    'xmllint not found. Switching to built-in validation. Install libxml2 or change validation engine in settings.',
                    'Change Engine'
                ).then(action => {
                    if (action === 'Change Engine') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'ditacraft.validationEngine');
                    }
                });

                // Fall back to built-in validation
                return this.validateWithBuiltIn(filePath);
            }

            // Parse xmllint errors
            const errors = this.parseXmllintErrors(error.stderr || error.stdout || '');

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
    private async validateWithBuiltIn(filePath: string): Promise<ValidationResult> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Create XML parser with validation
            const parser = new XMLParser({
                ignoreAttributes: false,
                parseAttributeValue: true,
                parseTagValue: true,
                trimValues: true,
                processEntities: true,
                allowBooleanAttributes: true,
                stopNodes: ['*.cdata']
            });

            // Try to parse
            parser.parse(content);

            // Basic XML is valid
            return {
                valid: true,
                errors: [],
                warnings: []
            };

        } catch (error: any) {
            // Parse error from fast-xml-parser
            const errors: ValidationError[] = [];

            if (error.message) {
                // Try to extract line number from error message
                const lineMatch = error.message.match(/line:(\d+)/i) ||
                                 error.message.match(/at position (\d+)/i);
                const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;

                errors.push({
                    line: line,
                    column: 0,
                    severity: 'error',
                    message: error.message,
                    source: 'xml-parser'
                });
            }

            return {
                valid: false,
                errors: errors,
                warnings: []
            };
        }
    }

    /**
     * Validate DITA-specific structure and rules
     */
    private async validateDitaStructure(filePath: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();

            // Check DOCTYPE declaration
            if (!content.includes('<!DOCTYPE')) {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: 'Missing DOCTYPE declaration',
                    source: 'dita-validator'
                });
            }

            // Validate based on file type
            if (ext === '.dita') {
                this.validateDitaTopic(content, errors, warnings);
            } else if (ext === '.ditamap') {
                this.validateDitaMap(content, errors, warnings);
            } else if (ext === '.bookmap') {
                this.validateBookmap(content, errors, warnings);
            }

            // Check for common DITA issues
            this.checkCommonIssues(content, errors, warnings);

        } catch (error: any) {
            // Ignore parsing errors (already caught by XML validation)
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

        // Check for required title element (MANDATORY per DITA DTD)
        if (!content.includes('<title>')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic MUST contain a <title> element (required by DTD)',
                source: 'dita-validator'
            });
        } else if (content.includes('<title></title>') || content.includes('<title/>')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic <title> element cannot be empty (required by DTD)',
                source: 'dita-validator'
            });
        }

        // Check for id attribute on root (REQUIRED per DITA DTD)
        const idMatch = content.match(/<(?:topic|concept|task|reference)\s+id="([^"]*)"/);
        if (!idMatch) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element MUST have an id attribute (required by DTD)',
                source: 'dita-validator'
            });
        } else if (idMatch[1] === '') {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element id attribute cannot be empty',
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
