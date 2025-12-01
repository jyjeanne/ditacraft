/**
 * Error Utility Functions
 * Provides safe error message extraction and handling utilities
 */

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
 * Logs any errors to console to avoid unhandled promise rejections
 *
 * @param promiseOrThenable - Promise or Thenable to execute
 * @param context - Optional context string for error logging
 */
export function fireAndForget(promiseOrThenable: Promise<unknown> | Thenable<unknown>, context?: string): void {
    Promise.resolve(promiseOrThenable).catch((error: unknown) => {
        const message = getErrorMessage(error);
        if (context) {
            console.error(`[${context}] Fire-and-forget error: ${message}`);
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
