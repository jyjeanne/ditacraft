/**
 * Diagnostics Manager
 * P2-1: Manages VS Code diagnostics for validation results
 */

import * as vscode from 'vscode';
import { ValidationResult, ValidationError } from './validationTypes';

/**
 * Manages VS Code diagnostics for DITA validation
 */
export class DiagnosticsManager implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(collectionName: string = 'dita') {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection(collectionName);
    }

    /**
     * Update VS Code diagnostics from validation result
     */
    public update(fileUri: vscode.Uri, result: ValidationResult): void {
        const diagnostics: vscode.Diagnostic[] = [];

        // Add errors
        for (const error of result.errors) {
            const diagnostic = this.createDiagnostic(error, vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }

        // Add warnings
        for (const warning of result.warnings) {
            const diagnostic = this.createDiagnostic(warning, vscode.DiagnosticSeverity.Warning);
            diagnostics.push(diagnostic);
        }

        this.diagnosticCollection.set(fileUri, diagnostics);
    }

    /**
     * Create a VS Code diagnostic from a validation error
     */
    private createDiagnostic(error: ValidationError, defaultSeverity: vscode.DiagnosticSeverity): vscode.Diagnostic {
        const range = new vscode.Range(
            new vscode.Position(error.line, error.column),
            new vscode.Position(error.line, error.column + 100) // Highlight line
        );

        const severity = this.mapSeverity(error.severity, defaultSeverity);
        const diagnostic = new vscode.Diagnostic(range, error.message, severity);
        diagnostic.source = error.source;

        return diagnostic;
    }

    /**
     * Map validation severity to VS Code severity
     */
    private mapSeverity(
        severity: 'error' | 'warning' | 'info',
        defaultSeverity: vscode.DiagnosticSeverity
    ): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            default:
                return defaultSeverity;
        }
    }

    /**
     * Clear diagnostics for a file
     */
    public clear(fileUri: vscode.Uri): void {
        this.diagnosticCollection.delete(fileUri);
    }

    /**
     * Clear all diagnostics
     */
    public clearAll(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Get diagnostics for a file
     */
    public get(fileUri: vscode.Uri): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(fileUri) || [];
    }

    /**
     * Dispose of the diagnostics collection
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
