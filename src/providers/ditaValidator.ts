/**
 * DITA Validator
 * P2-1: Refactored to use modular validation engines
 *
 * This class orchestrates validation using different engines:
 * - TypesXML: Full DTD validation (default)
 * - XMLLint: External tool validation
 * - Built-in: fast-xml-parser based validation
 */

import * as vscode from 'vscode';
import { promises as fsPromises } from 'fs';
import {
    ValidationResult,
    IValidationEngine,
    isDisposable,
    BuiltinEngine,
    XmllintEngine,
    TypesxmlEngine,
    DitaStructureValidator,
    DiagnosticsManager,
    createErrorResult,
    mergeResults
} from './validation';
import { validateDitaContentModel } from './ditaContentModelValidator';
import { configManager } from '../utils/configurationManager';
import { VALIDATION_ENGINES } from '../utils/constants';

// Re-export types for backward compatibility
export { ValidationError, ValidationResult } from './validation';

/**
 * Orchestrates DITA file validation using modular engines
 */
export class DitaValidator implements vscode.Disposable {
    private diagnosticsManager: DiagnosticsManager;
    private structureValidator: DitaStructureValidator;

    // Validation engines
    private builtinEngine: BuiltinEngine | null = null;
    private xmllintEngine: XmllintEngine | null = null;
    private typesxmlEngine: TypesxmlEngine | null = null;

    private extensionPath: string | null = null;
    private currentEngine: 'typesxml' | 'xmllint' | 'built-in';

    constructor(extensionContext?: vscode.ExtensionContext) {
        this.diagnosticsManager = new DiagnosticsManager('dita');
        this.structureValidator = new DitaStructureValidator();
        this.currentEngine = this.getValidationEngine();

        if (extensionContext) {
            this.extensionPath = extensionContext.extensionPath;
            this.initializeEngines();
        }
    }

    /**
     * Initialize validation engines based on configuration
     *
     * Sets up the validation engine ecosystem with fallback chains. Uses lazy
     * initialization for engines that may not be needed based on configuration.
     *
     * ## Engine Initialization
     * - **Built-in**: Always initialized (serves as ultimate fallback)
     * - **TypesXML**: Initialized if configured, with `onNotAvailable` callback to built-in
     * - **XMLLint**: Initialized only if configured, with `onNotAvailable` callback to built-in
     *
     * ## Fallback Chain
     * Each external engine has an `onNotAvailable` callback that triggers when:
     * - The engine is not installed (xmllint not found)
     * - The engine fails to load (TypesXML module error)
     * - The engine encounters an unrecoverable error
     *
     * ```
     * TypesXML ─── onNotAvailable ──→ Built-in
     * XMLLint  ─── onNotAvailable ──→ Built-in
     * ```
     *
     * ## Callback Signature
     * The `onNotAvailable` callback receives `(content, filePath)` to allow the
     * fallback engine to validate using the same file content without re-reading.
     */
    private initializeEngines(): void {
        if (!this.extensionPath) {
            return;
        }

        // Initialize built-in engine (always available)
        this.builtinEngine = new BuiltinEngine(this.extensionPath);

        // Initialize TypesXML engine if configured
        if (this.currentEngine === VALIDATION_ENGINES.TYPESXML) {
            this.typesxmlEngine = new TypesxmlEngine(this.extensionPath);

            // Set fallback to built-in (receives actual content and filePath)
            this.typesxmlEngine.onNotAvailable = (content, filePath) => this.validateWithBuiltin(content, filePath);

            // Fall back if TypesXML not available
            if (!this.typesxmlEngine.isAvailable) {
                this.currentEngine = VALIDATION_ENGINES.BUILT_IN as 'built-in';
            }
        }

        // Initialize xmllint engine if configured
        if (this.currentEngine === VALIDATION_ENGINES.XMLLINT) {
            this.xmllintEngine = new XmllintEngine();
            // Set fallback to built-in (receives actual content and filePath)
            this.xmllintEngine.onNotAvailable = (content, filePath) => this.validateWithBuiltin(content, filePath);
        }
    }

    /**
     * Get the configured validation engine
     */
    private getValidationEngine(): 'typesxml' | 'xmllint' | 'built-in' {
        return configManager.get('validationEngine');
    }

    /**
     * Get the current active engine
     *
     * Implements the Strategy pattern for validation engine selection.
     * Returns the engine instance corresponding to the current configuration.
     *
     * ## Strategy Pattern
     * ```
     * IValidationEngine (interface)
     *         │
     *    ┌────┼────┬──────────┐
     *    ▼    ▼    ▼          ▼
     * TypesXML  XMLLint  Built-in  (future engines...)
     * ```
     *
     * All engines implement `IValidationEngine.validate(content, filePath)`,
     * allowing the validator to treat them uniformly.
     *
     * @returns The currently configured validation engine, or built-in as default.
     *          Returns null if no engines are initialized (no extension context).
     */
    private getActiveEngine(): IValidationEngine | null {
        switch (this.currentEngine) {
            case VALIDATION_ENGINES.TYPESXML:
                return this.typesxmlEngine;
            case VALIDATION_ENGINES.XMLLINT:
                return this.xmllintEngine;
            case VALIDATION_ENGINES.BUILT_IN:
            default:
                return this.builtinEngine;
        }
    }

    /**
     * Validate a DITA file
     *
     * This is the main validation entry point that orchestrates multiple validation
     * passes and aggregates results. It implements a layered validation strategy.
     *
     * ## Validation Pipeline
     * ```
     * Input File
     *     │
     *     ▼
     * ┌─────────────────────────────────────┐
     * │ 1. Engine Selection (Strategy)      │
     * │    TypesXML → XMLLint → Built-in    │
     * └──────────────┬──────────────────────┘
     *                │
     *     ┌──────────┴──────────┐
     *     ▼                     ▼
     * TypesXML:             Built-in/XMLLint:
     * ├─ DTD validation     ├─ XML well-formedness
     * └─ Element models     ├─ Basic DTD checks
     *                       └─ Content model validation
     *     │                     │
     *     └──────────┬──────────┘
     *                ▼
     * ┌─────────────────────────────────────┐
     * │ 2. Structure Validation             │
     * │    - Required elements              │
     * │    - DITA-specific rules            │
     * └──────────────┬──────────────────────┘
     *                ▼
     *          Diagnostics
     * ```
     *
     * ## Engine Fallback
     * If the configured engine is unavailable (e.g., xmllint not installed),
     * validation automatically falls back to the built-in engine.
     *
     * ## TypesXML Optimization
     * When TypesXML is active, content model validation is skipped because
     * TypesXML provides comprehensive DTD validation including content models.
     *
     * @param fileUri - VS Code URI of the file to validate
     * @returns Promise resolving to ValidationResult with errors, warnings, and validity status
     *
     * @example
     * ```typescript
     * const result = await validator.validateFile(document.uri);
     *
     * if (!result.valid) {
     *     result.errors.forEach(err => {
     *         console.error(`${err.line}:${err.column}: ${err.message}`);
     *     });
     * }
     * ```
     */
    public async validateFile(fileUri: vscode.Uri): Promise<ValidationResult> {
        const filePath = fileUri.fsPath;

        // Read file content once
        let fileContent: string;
        try {
            fileContent = await fsPromises.readFile(filePath, 'utf8');
        } catch (_error) {
            const result = createErrorResult(
                'File does not exist or cannot be read',
                'ditacraft'
            );
            this.diagnosticsManager.update(fileUri, result);
            return result;
        }

        // Check for engine configuration changes
        this.updateEngineIfNeeded();

        // Determine if TypesXML is active (affects structure validation)
        const useTypesXML = this.currentEngine === VALIDATION_ENGINES.TYPESXML &&
            this.typesxmlEngine?.isAvailable === true;

        // Run primary validation
        let result: ValidationResult;
        const engine = this.getActiveEngine();

        if (engine) {
            result = await engine.validate(fileContent, filePath);
        } else {
            result = await this.validateWithBuiltin(fileContent, filePath);
        }

        // Add DITA structure validation
        const structureResult = this.structureValidator.validate(
            fileContent,
            filePath,
            { skipDtdChecks: useTypesXML }
        );

        // Add content model validation (only if NOT using TypesXML)
        if (!useTypesXML) {
            const contentModelValidation = validateDitaContentModel(fileContent);
            result.errors.push(...contentModelValidation.errors);
            result.warnings.push(...contentModelValidation.warnings);
        }

        // Merge structure results
        result = mergeResults(result, structureResult);

        // Update diagnostics
        this.diagnosticsManager.update(fileUri, result);

        return result;
    }

    /**
     * Update engine if configuration changed
     *
     * Implements hot-swapping of validation engines when user changes settings.
     * Called at the start of each validation to ensure we're using the user's
     * preferred engine.
     *
     * ## Hot-Swap Process
     * 1. Read current engine from configuration
     * 2. If changed from current, initialize new engine (if not already initialized)
     * 3. Set up fallback callback for new engine
     * 4. Verify availability (for TypesXML), fall back to built-in if unavailable
     *
     * ## Lazy Initialization
     * Engines are lazily initialized on first use. This means switching to an
     * engine for the first time will create a new instance, but switching back
     * to a previously-used engine will reuse the existing instance.
     *
     * ## Availability Check
     * TypesXML requires bundled DTD files. If these are missing or corrupted,
     * validation automatically degrades to the built-in engine.
     */
    private updateEngineIfNeeded(): void {
        const newEngine = this.getValidationEngine();

        if (newEngine !== this.currentEngine) {
            // Initialize new engine if needed
            if (newEngine === VALIDATION_ENGINES.TYPESXML && !this.typesxmlEngine && this.extensionPath) {
                this.typesxmlEngine = new TypesxmlEngine(this.extensionPath);
                this.typesxmlEngine.onNotAvailable = (content, filePath) => this.validateWithBuiltin(content, filePath);
            }

            if (newEngine === VALIDATION_ENGINES.XMLLINT && !this.xmllintEngine) {
                this.xmllintEngine = new XmllintEngine();
                this.xmllintEngine.onNotAvailable = (content, filePath) => this.validateWithBuiltin(content, filePath);
            }

            this.currentEngine = newEngine;

            // Check if TypesXML is available, fall back if not
            if (this.currentEngine === VALIDATION_ENGINES.TYPESXML &&
                !this.typesxmlEngine?.isAvailable) {
                this.currentEngine = VALIDATION_ENGINES.BUILT_IN as 'built-in';
            }
        }
    }

    /**
     * Validate using built-in engine (fallback)
     */
    private async validateWithBuiltin(content: string, filePath: string): Promise<ValidationResult> {
        if (!this.builtinEngine && this.extensionPath) {
            this.builtinEngine = new BuiltinEngine(this.extensionPath);
        }

        if (this.builtinEngine) {
            return this.builtinEngine.validate(content, filePath);
        }

        return { valid: true, errors: [], warnings: [] };
    }

    /**
     * Clear diagnostics for a file
     */
    public clearDiagnostics(fileUri: vscode.Uri): void {
        this.diagnosticsManager.clear(fileUri);
    }

    /**
     * Clear all diagnostics
     */
    public clearAllDiagnostics(): void {
        this.diagnosticsManager.clearAll();
    }

    /**
     * Dispose validator resources
     */
    public dispose(): void {
        this.diagnosticsManager.dispose();

        // Dispose engines that implement Disposable
        if (this.typesxmlEngine && isDisposable(this.typesxmlEngine)) {
            this.typesxmlEngine.dispose();
        }

        this.builtinEngine = null;
        this.xmllintEngine = null;
        this.typesxmlEngine = null;
    }
}
