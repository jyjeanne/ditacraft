/**
 * Validation Module
 * P2-1: Re-exports all validation-related types and classes
 */

// Types
export {
    ValidationError,
    ValidationResult,
    createEmptyResult,
    createErrorResult,
    mergeResults
} from './validationTypes';

// Interfaces
export {
    IValidationEngine,
    IDisposableValidationEngine,
    isDisposable
} from './validationEngineBase';

// Engines
export { BuiltinEngine } from './builtinEngine';
export { XmllintEngine } from './xmllintEngine';
export { TypesxmlEngine } from './typesxmlEngine';

// Validators
export { DitaStructureValidator, DitaStructureValidatorOptions } from './ditaStructureValidator';

// Diagnostics
export { DiagnosticsManager } from './diagnosticsManager';
