/**
 * Rate Limiter
 * P3-6: Protection against DoS via rapid validation/operation requests
 *
 * Implements a sliding window rate limiter to limit the frequency
 * of operations per key (e.g., per file path or per operation type).
 */

import * as vscode from 'vscode';
import { logger } from './logger';

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Whether to log when rate limit is exceeded */
    logExceeded?: boolean;
}

/**
 * Default rate limit configurations for different operation types
 */
export const RATE_LIMIT_DEFAULTS = {
    /** Validation requests - allow 10 per second per file */
    VALIDATION: {
        maxRequests: 10,
        windowMs: 1000,
        logExceeded: true
    } as RateLimitConfig,

    /** File watcher events - allow 20 per second */
    FILE_WATCHER: {
        maxRequests: 20,
        windowMs: 1000,
        logExceeded: false
    } as RateLimitConfig,

    /** Key space builds - allow 5 per minute per root map */
    KEY_SPACE_BUILD: {
        maxRequests: 5,
        windowMs: 60000,
        logExceeded: true
    } as RateLimitConfig,

    /** Preview generation - allow 3 per second */
    PREVIEW: {
        maxRequests: 3,
        windowMs: 1000,
        logExceeded: true
    } as RateLimitConfig
};

/**
 * Sliding window rate limiter
 * Tracks request timestamps per key and allows/denies based on configured limits
 */
export class RateLimiter implements vscode.Disposable {
    private requests: Map<string, number[]> = new Map();
    private config: RateLimitConfig;
    private cleanupInterval: NodeJS.Timeout | undefined;

    constructor(config: RateLimitConfig) {
        this.config = config;

        // Set up periodic cleanup to prevent memory leaks
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, Math.max(this.config.windowMs * 2, 60000)); // Cleanup at least every minute
    }

    /**
     * Check if a request is allowed for the given key
     * @param key - Unique identifier for the rate limit bucket (e.g., file path)
     * @returns true if request is allowed, false if rate limited
     */
    public isAllowed(key: string): boolean {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Get existing requests for this key
        let timestamps = this.requests.get(key);

        if (!timestamps) {
            timestamps = [];
            this.requests.set(key, timestamps);
        }

        // Remove timestamps outside the current window
        timestamps = timestamps.filter(ts => ts > windowStart);
        this.requests.set(key, timestamps);

        // Check if under limit
        if (timestamps.length < this.config.maxRequests) {
            timestamps.push(now);
            return true;
        }

        // Rate limited
        if (this.config.logExceeded) {
            logger.debug('Rate limit exceeded', {
                key,
                requestsInWindow: timestamps.length,
                maxRequests: this.config.maxRequests,
                windowMs: this.config.windowMs
            });
        }

        return false;
    }

    /**
     * Try to acquire a rate limit slot, executing callback if allowed
     * @param key - Unique identifier for the rate limit bucket
     * @param callback - Function to execute if allowed
     * @returns Result of callback or undefined if rate limited
     */
    public async tryExecute<T>(
        key: string,
        callback: () => T | Promise<T>
    ): Promise<T | undefined> {
        if (!this.isAllowed(key)) {
            return undefined;
        }

        return callback();
    }

    /**
     * Get the remaining requests allowed for a key in the current window
     */
    public getRemainingRequests(key: string): number {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        const timestamps = this.requests.get(key);

        if (!timestamps) {
            return this.config.maxRequests;
        }

        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        return Math.max(0, this.config.maxRequests - validTimestamps.length);
    }

    /**
     * Reset rate limit for a specific key
     */
    public reset(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Reset all rate limits
     */
    public resetAll(): void {
        this.requests.clear();
    }

    /**
     * Get statistics about current rate limiting state
     */
    public getStats(): {
        trackedKeys: number;
        totalRequests: number;
        config: RateLimitConfig;
    } {
        let totalRequests = 0;
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        for (const timestamps of this.requests.values()) {
            totalRequests += timestamps.filter(ts => ts > windowStart).length;
        }

        return {
            trackedKeys: this.requests.size,
            totalRequests,
            config: this.config
        };
    }

    /**
     * Clean up expired entries to prevent memory leaks
     */
    private cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        const keysToDelete: string[] = [];

        for (const [key, timestamps] of this.requests.entries()) {
            // Filter to only timestamps in current window
            const validTimestamps = timestamps.filter(ts => ts > windowStart);

            if (validTimestamps.length === 0) {
                keysToDelete.push(key);
            } else {
                this.requests.set(key, validTimestamps);
            }
        }

        // Delete empty keys
        for (const key of keysToDelete) {
            this.requests.delete(key);
        }

        if (keysToDelete.length > 0) {
            logger.debug('Rate limiter cleanup completed', {
                removedKeys: keysToDelete.length,
                remainingKeys: this.requests.size
            });
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.requests.clear();
    }
}

/**
 * Create a rate limiter with default configuration for a specific operation type
 */
export function createRateLimiter(
    type: keyof typeof RATE_LIMIT_DEFAULTS
): RateLimiter {
    return new RateLimiter(RATE_LIMIT_DEFAULTS[type]);
}

/**
 * Create a rate limiter with custom configuration
 */
export function createCustomRateLimiter(config: RateLimitConfig): RateLimiter {
    return new RateLimiter(config);
}
