/**
 * Validation Types
 * P2-1: Shared types for DITA validation
 */

/**
 * Represents a validation error or warning
 */
export interface ValidationError {
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    source: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

/**
 * Create an empty validation result
 */
export function createEmptyResult(): ValidationResult {
    return {
        valid: true,
        errors: [],
        warnings: []
    };
}

/**
 * Create a result with a single error
 */
export function createErrorResult(
    message: string,
    source: string,
    line: number = 0,
    column: number = 0
): ValidationResult {
    return {
        valid: false,
        errors: [{
            line,
            column,
            severity: 'error',
            message,
            source
        }],
        warnings: []
    };
}

/**
 * Merge multiple validation results into one
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
    const merged: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    for (const result of results) {
        merged.errors.push(...result.errors);
        merged.warnings.push(...result.warnings);
    }

    merged.valid = merged.errors.length === 0;
    return merged;
}
