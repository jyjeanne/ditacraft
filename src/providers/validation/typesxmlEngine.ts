/**
 * TypesXML Validation Engine
 * P2-1: TypesXML-based full DTD validation
 */

import * as vscode from 'vscode';
import { IDisposableValidationEngine } from './validationEngineBase';
import { ValidationResult, createEmptyResult } from './validationTypes';
import { TypesXMLValidator } from '../typesxmlValidator';
import { fireAndForget } from '../../utils/errorUtils';

/**
 * Validation engine using TypesXML for full DTD validation
 */
export class TypesxmlEngine implements IDisposableValidationEngine {
    public readonly name = 'typesxml';

    private validator: TypesXMLValidator | null = null;
    private hasShownWarning: boolean = false;

    /**
     * Callback for when TypesXML is not available
     * @param content - The content that was being validated
     * @param filePath - The file path that was being validated
     */
    public onNotAvailable?: (content: string, filePath: string) => Promise<ValidationResult>;

    /**
     * Error message if TypesXML failed to load
     */
    public get loadError(): string | undefined {
        return this.validator?.loadError ?? undefined;
    }

    constructor(extensionPath: string) {
        try {
            this.validator = new TypesXMLValidator(extensionPath);

            if (!this.validator.isAvailable) {
                this.showTypesXMLWarning();
            }
        } catch (error) {
            console.warn('Failed to initialize TypesXMLValidator:', error);
            this.validator = null;
        }
    }

    public get isAvailable(): boolean {
        return this.validator?.isAvailable === true;
    }

    /**
     * Validate using TypesXML
     */
    public async validate(content: string, filePath: string): Promise<ValidationResult> {
        if (!this.validator || !this.validator.isAvailable) {
            // Fall back if callback is provided
            if (this.onNotAvailable) {
                return this.onNotAvailable(content, filePath);
            }
            return createEmptyResult();
        }

        return this.validator.validate(content);
    }

    /**
     * Show warning when TypesXML is not available
     */
    private showTypesXMLWarning(): void {
        if (this.hasShownWarning) {
            return;
        }
        this.hasShownWarning = true;

        const error = this.validator?.loadError || 'Unknown error';
        console.warn('TypesXMLValidator not available:', error);

        fireAndForget(
            (async () => {
                const action = await vscode.window.showWarningMessage(
                    `TypesXML validation not available: ${error}. Falling back to built-in validation.`,
                    'Change Engine'
                );
                if (action === 'Change Engine') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'ditacraft.validationEngine');
                }
            })(),
            'typesxml-warning'
        );
    }

    /**
     * Dispose of TypesXML resources
     */
    public dispose(): void {
        if (this.validator) {
            this.validator.dispose();
            this.validator = null;
        }
    }
}
