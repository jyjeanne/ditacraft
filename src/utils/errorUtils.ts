/**
 * Error Utility Functions
 * Provides safe error message extraction and handling utilities
 */

import { logger } from './logger';

/**
 * Safely extract error message from unknown error type
 * Handles various error shapes commonly encountered in TypeScript
 *
 * @param error - Unknown error value
 * @param defaultMessage - Default message if extraction fails
 * @returns Extracted error message string
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
    // Handle null/undefined
    if (error === null || error === undefined) {
        return defaultMessage;
    }

    // Handle Error instances
    if (error instanceof Error) {
        return error.message || defaultMessage;
    }

    // Handle objects with message property
    if (typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;

        // Check for message property
        if (typeof errorObj.message === 'string' && errorObj.message.length > 0) {
            return errorObj.message;
        }

        // Check for msg property (used by some parsers like fast-xml-parser)
        if (typeof errorObj.msg === 'string' && errorObj.msg.length > 0) {
            return errorObj.msg;
        }

        // Check for error property (nested error)
        if (errorObj.error && typeof errorObj.error === 'object') {
            const nestedError = errorObj.error as Record<string, unknown>;
            if (typeof nestedError.message === 'string') {
                return nestedError.message;
            }
        }
    }

    // Handle string errors
    if (typeof error === 'string' && error.length > 0) {
        return error;
    }

    // Fallback: try to stringify
    try {
        const stringified = String(error);
        if (stringified && stringified !== '[object Object]') {
            return stringified;
        }
    } catch {
        // Ignore stringify errors
    }

    return defaultMessage;
}

/**
 * Thenable interface (compatible with VS Code's Thenable)
 */
interface Thenable<T> {
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): PromiseLike<TResult1 | TResult2>;
}

/**
 * Execute a promise or thenable without awaiting it (fire-and-forget pattern)
 * Logs any errors to the logger to avoid unhandled promise rejections
 *
 * @param promiseOrThenable - Promise or Thenable to execute
 * @param context - Optional context string for error logging
 */
export function fireAndForget(promiseOrThenable: Promise<unknown> | Thenable<unknown>, context?: string): void {
    Promise.resolve(promiseOrThenable).catch((error: unknown) => {
        const message = getErrorMessage(error);
        if (context) {
            logger.error(`[${context}] Fire-and-forget error: ${message}`);
        } else {
            logger.error(`Fire-and-forget error: ${message}`);
        }
        // Silently handled - prevents unhandled promise rejection
    });
}

/**
 * Wrap an async operation that may fail with a default value
 * Useful for optional operations that shouldn't break the main flow
 *
 * @param operation - Async operation to attempt
 * @param defaultValue - Value to return if operation fails
 * @returns Result of operation or default value
 */
export async function tryAsync<T>(
    operation: () => Promise<T>,
    defaultValue: T
): Promise<T> {
    try {
        return await operation();
    } catch {
        return defaultValue;
    }
}

/**
 * Check if an error indicates a "file not found" condition
 * Works across different error formats from Node.js and other sources
 *
 * @param error - Error to check
 * @returns True if error indicates file not found
 */
export function isFileNotFoundError(error: unknown): boolean {
    if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
            return true;
        }
    }

    if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (errorObj.code === 'ENOENT') {
            return true;
        }
    }

    const message = getErrorMessage(error, '');
    return message.toLowerCase().includes('file not found') ||
           message.toLowerCase().includes('no such file') ||
           message.toLowerCase().includes('does not exist');
}

/**
 * Format error message for user display with consistent styling
 * Adds context, error codes, and helpful suggestions
 *
 * @param error - Error to format
 * @param context - Context for the error (e.g., "Preview", "Validation")
 * @param suggestions - Optional array of suggestions for resolving the error
 * @returns Formatted error message string
 */
export function formatErrorMessage(
    error: unknown,
    context: string,
    suggestions?: string[]
): string {
    const errorMessage = getErrorMessage(error);
    const formattedParts: string[] = [];

    // Add context
    formattedParts.push(`🚨 ${context} Error`);

    // Add main error message
    formattedParts.push(`**${errorMessage}**`);

    // Add suggestions if provided
    if (suggestions && suggestions.length > 0) {
        formattedParts.push('');
        formattedParts.push('💡 Suggestions:');
        suggestions.forEach((suggestion, index) => {
            formattedParts.push(`  ${index + 1}. ${suggestion}`);
        });
    }

    // Add error code if available
    if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>;
        if (errorObj.code) {
            formattedParts.push('');
            formattedParts.push(`📋 Error Code: ${errorObj.code}`);
        }
    }

    return formattedParts.join('\n');
}

/**
 * Create a user-friendly error message for DITA-specific errors
 * Handles common DITA error patterns and provides context-specific help
 *
 * @param error - Error to format
 * @param errorType - Type of DITA error (e.g., "validation", "publishing", "preview")
 * @returns Formatted DITA error message
 */
export function formatDitaError(
    error: unknown,
    errorType: 'validation' | 'publishing' | 'preview' | 'general'
): string {
    const errorMessage = getErrorMessage(error);
    const suggestions: string[] = [];

    // Generate context-specific suggestions
    switch (errorType) {
        case 'validation':
            if (errorMessage.includes('DOCTYPE')) {
                suggestions.push('Add a proper DOCTYPE declaration to your DITA file');
                suggestions.push('Check that your DITA file has the correct root element (topic, concept, task, etc.)');
            }
            if (errorMessage.includes('id attribute')) {
                suggestions.push('Add a unique id attribute to the root element');
                suggestions.push('Ensure the id value is not empty and follows DITA naming conventions');
            }
            if (errorMessage.includes('title')) {
                suggestions.push('Add a <title> element as the first child of your root element');
                suggestions.push('Ensure the title is not empty');
            }
            break;

        case 'publishing':
            if (errorMessage.includes('DITA-OT')) {
                suggestions.push('Verify DITA-OT is properly installed and configured');
                suggestions.push('Check the DITA-OT path in DitaCraft settings');
            }
            if (errorMessage.includes('timeout')) {
                suggestions.push('Increase the DITA-OT timeout in settings');
                suggestions.push('Try publishing a smaller DITA project first');
            }
            break;

        case 'preview':
            if (errorMessage.includes('HTML file')) {
                suggestions.push('Try regenerating the preview');
                suggestions.push('Check that DITA-OT completed successfully');
            }
            break;

        case 'general':
            suggestions.push('Check the DitaCraft output channel for detailed logs');
            suggestions.push('Try restarting VS Code');
            break;
    }

    // Add common DITA suggestions
    suggestions.push('Consult the DITA specification for your document type');
    suggestions.push('Check the DitaCraft documentation for troubleshooting tips');

    return formatErrorMessage(error, `DITA ${errorType.charAt(0).toUpperCase() + errorType.slice(1)}`, suggestions);
}

/**
 * Create an error object with additional context for logging
 * Preserves the original error while adding debugging information
 *
 * @param error - Original error
 * @param context - Additional context for debugging
 * @param metadata - Optional metadata to include
 * @returns Enhanced error object
 */
export function createEnhancedError(
    error: unknown,
    context: string,
    metadata?: Record<string, unknown>
): Error {
    const errorMessage = getErrorMessage(error);
    const enhancedError = new Error(`[${context}] ${errorMessage}`);

    // Preserve original error details
    if (error instanceof Error) {
        enhancedError.stack = error.stack;
        // Check for error.cause (ES2022+) using 'in' operator for compatibility
        if ('cause' in error && error.cause !== undefined) {
            (enhancedError as unknown as { cause: unknown }).cause = error.cause;
        }
    }

    // Add metadata if provided
    if (metadata) {
        const errorWithMeta = enhancedError as Error & Record<string, unknown>;
        Object.keys(metadata).forEach(key => {
            errorWithMeta[key] = metadata[key];
        });
    }

    return enhancedError;
}
