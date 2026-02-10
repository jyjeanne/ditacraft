/**
 * DITA File Decoration Provider
 * Adds validation badges (error/warning counts) to files in the DITA Explorer tree.
 */

import * as vscode from 'vscode';
import { isDitaFilePath } from '../utils/constants';

function isDitaUri(uri: vscode.Uri): boolean {
    return isDitaFilePath(uri.fsPath);
}

/**
 * Provides file decorations based on diagnostic counts for DITA files.
 */
export class DitaFileDecorationProvider implements vscode.FileDecorationProvider, vscode.Disposable {
    private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    private _disposable: vscode.Disposable;

    constructor() {
        this._disposable = vscode.languages.onDidChangeDiagnostics(e => {
            const ditaUris = e.uris.filter(isDitaUri);
            if (ditaUris.length > 0) {
                this._onDidChangeFileDecorations.fire(ditaUris);
            }
        });
    }

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        if (!isDitaUri(uri)) {
            return undefined;
        }

        const diagnostics = vscode.languages.getDiagnostics(uri);
        if (diagnostics.length === 0) {
            return undefined;
        }

        let errors = 0;
        let warnings = 0;
        for (const d of diagnostics) {
            if (d.severity === vscode.DiagnosticSeverity.Error) {
                errors++;
            } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
                warnings++;
            }
        }

        if (errors > 0) {
            return {
                badge: `${errors}`,
                tooltip: `${errors} error${errors > 1 ? 's' : ''}${warnings > 0 ? `, ${warnings} warning${warnings > 1 ? 's' : ''}` : ''}`,
                color: new vscode.ThemeColor('list.errorForeground')
            };
        }

        if (warnings > 0) {
            return {
                badge: `${warnings}`,
                tooltip: `${warnings} warning${warnings > 1 ? 's' : ''}`,
                color: new vscode.ThemeColor('list.warningForeground')
            };
        }

        return undefined;
    }

    dispose(): void {
        this._onDidChangeFileDecorations.dispose();
        this._disposable.dispose();
    }
}
