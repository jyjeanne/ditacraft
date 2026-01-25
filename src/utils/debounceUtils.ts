/**
 * Debounce Utilities
 * P2-6: Centralized debounce implementations for consistent behavior across the codebase
 */

import { Disposable } from 'vscode';

/**
 * Result of createDebouncedMap - provides schedule, cancel, and dispose methods
 */
export interface DebouncedMap<K, V> extends Disposable {
    /**
     * Schedule a debounced call for the given key
     * If a call is already scheduled for this key, it will be replaced
     */
    schedule: (key: K, value: V) => void;

    /**
     * Cancel any pending call for the given key
     */
    cancel: (key: K) => void;

    /**
     * Get count of pending operations
     */
    pendingCount: () => number;

    /**
     * Dispose all pending timers
     */
    dispose: () => void;
}

/**
 * Create a debounced handler map for per-key debouncing
 * Useful when you need to debounce operations on multiple items (e.g., per-file validation)
 *
 * @param handler - Async function to call with the key and value
 * @param delayMs - Debounce delay in milliseconds
 * @returns Object with schedule, cancel, pendingCount, and dispose methods
 *
 * @example
 * const debouncedValidation = createDebouncedMap<string, vscode.TextDocument>(
 *     async (filePath, document) => {
 *         await validateDocument(document);
 *     },
 *     500
 * );
 *
 * // Schedule validation for a file
 * debouncedValidation.schedule(document.uri.fsPath, document);
 *
 * // Cancel pending validation for a file
 * debouncedValidation.cancel(document.uri.fsPath);
 *
 * // Clean up on extension deactivation
 * context.subscriptions.push(debouncedValidation);
 */
export function createDebouncedMap<K, V>(
    handler: (key: K, value: V) => Promise<void> | void,
    delayMs: number
): DebouncedMap<K, V> {
    const timers = new Map<K, NodeJS.Timeout>();

    return {
        schedule(key: K, value: V): void {
            // Clear existing timer for this key
            const existing = timers.get(key);
            if (existing) {
                clearTimeout(existing);
            }

            // Set new timer
            const timer = setTimeout(() => {
                timers.delete(key);
                // Fire-and-forget the handler
                Promise.resolve(handler(key, value)).catch(() => {
                    // Errors should be handled by the handler itself
                });
            }, delayMs);

            timers.set(key, timer);
        },

        cancel(key: K): void {
            const timer = timers.get(key);
            if (timer) {
                clearTimeout(timer);
                timers.delete(key);
            }
        },

        pendingCount(): number {
            return timers.size;
        },

        dispose(): void {
            for (const timer of timers.values()) {
                clearTimeout(timer);
            }
            timers.clear();
        }
    };
}

/**
 * Result of createDebounced - provides schedule, cancel, and dispose methods
 */
export interface Debounced<T> extends Disposable {
    /**
     * Schedule a debounced call with the given value
     * If a call is already scheduled, it will be replaced
     */
    schedule: (value: T) => void;

    /**
     * Cancel any pending call
     */
    cancel: () => void;

    /**
     * Check if there's a pending call
     */
    isPending: () => boolean;

    /**
     * Dispose the timer
     */
    dispose: () => void;
}

/**
 * Create a simple debounced handler
 * Useful for single-value debouncing (e.g., document change events)
 *
 * @param handler - Function to call with the value
 * @param delayMs - Debounce delay in milliseconds
 * @returns Object with schedule, cancel, isPending, and dispose methods
 *
 * @example
 * const debouncedCheck = createDebounced<vscode.TextDocument>(
 *     async (document) => {
 *         await checkDocument(document);
 *     },
 *     1000
 * );
 *
 * // Schedule check
 * debouncedCheck.schedule(document);
 *
 * // Cancel pending check
 * debouncedCheck.cancel();
 *
 * // Clean up
 * context.subscriptions.push(debouncedCheck);
 */
export function createDebounced<T>(
    handler: (value: T) => Promise<void> | void,
    delayMs: number
): Debounced<T> {
    let timer: NodeJS.Timeout | undefined;

    return {
        schedule(value: T): void {
            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(() => {
                timer = undefined;
                Promise.resolve(handler(value)).catch(() => {
                    // Errors should be handled by the handler itself
                });
            }, delayMs);
        },

        cancel(): void {
            if (timer) {
                clearTimeout(timer);
                timer = undefined;
            }
        },

        isPending(): boolean {
            return timer !== undefined;
        },

        dispose(): void {
            if (timer) {
                clearTimeout(timer);
                timer = undefined;
            }
        }
    };
}

/**
 * Create a debounced set collector
 * Collects values into a set and calls the handler with all collected values after the delay
 * Useful for batching multiple events (e.g., file watcher events)
 *
 * @param handler - Function to call with the collected values
 * @param delayMs - Debounce delay in milliseconds
 * @returns Object with add, cancel, pendingCount, and dispose methods
 *
 * @example
 * const batchedInvalidation = createDebouncedSet<string>(
 *     async (files) => {
 *         for (const file of files) {
 *             invalidateCache(file);
 *         }
 *     },
 *     300
 * );
 *
 * // Add files to batch
 * batchedInvalidation.add('file1.dita');
 * batchedInvalidation.add('file2.dita');
 * // Handler will be called once with both files after 300ms
 */
export interface DebouncedSet<T> extends Disposable {
    /**
     * Add a value to the pending set
     */
    add: (value: T) => void;

    /**
     * Cancel pending call and clear collected values
     */
    cancel: () => void;

    /**
     * Get count of pending values
     */
    pendingCount: () => number;

    /**
     * Dispose the timer and clear collected values
     */
    dispose: () => void;
}

export function createDebouncedSet<T>(
    handler: (values: Set<T>) => Promise<void> | void,
    delayMs: number
): DebouncedSet<T> {
    const pendingValues = new Set<T>();
    let timer: NodeJS.Timeout | undefined;

    return {
        add(value: T): void {
            pendingValues.add(value);

            // Reset timer
            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(() => {
                timer = undefined;
                const valuesToProcess = new Set(pendingValues);
                pendingValues.clear();
                Promise.resolve(handler(valuesToProcess)).catch(() => {
                    // Errors should be handled by the handler itself
                });
            }, delayMs);
        },

        cancel(): void {
            if (timer) {
                clearTimeout(timer);
                timer = undefined;
            }
            pendingValues.clear();
        },

        pendingCount(): number {
            return pendingValues.size;
        },

        dispose(): void {
            if (timer) {
                clearTimeout(timer);
                timer = undefined;
            }
            pendingValues.clear();
        }
    };
}
