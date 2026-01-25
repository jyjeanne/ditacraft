/**
 * Validation Engine Base
 * P2-1: Base interface for validation engines
 */

import { ValidationResult } from './validationTypes';

/**
 * Interface for validation engines
 * All validation engines must implement this interface
 */
export interface IValidationEngine {
    /**
     * Name of the validation engine
     */
    readonly name: string;

    /**
     * Check if the engine is available and ready to use
     */
    readonly isAvailable: boolean;

    /**
     * Validate XML content
     * @param content - XML content to validate
     * @param filePath - Path to the file (for context)
     * @returns Validation result
     */
    validate(content: string, filePath: string): Promise<ValidationResult>;
}

/**
 * Interface for disposable validation engines
 */
export interface IDisposableValidationEngine extends IValidationEngine {
    /**
     * Dispose of engine resources
     */
    dispose(): void;
}

/**
 * Check if an engine is disposable
 */
export function isDisposable(engine: IValidationEngine): engine is IDisposableValidationEngine {
    return 'dispose' in engine && typeof (engine as IDisposableValidationEngine).dispose === 'function';
}
