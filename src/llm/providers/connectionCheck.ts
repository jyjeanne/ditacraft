/**
 * Wording of a failed connection check, shared by the API providers (their SDKs' errors are
 * normalized to `ApiFailure` first).
 */

export interface ApiFailure {
    /** The HTTP status the service answered with. */
    status?: number;
    /** No HTTP answer: a timeout, a refused or failed connection, a cancellation. */
    kind?: 'timeout' | 'connection' | 'abort';
    message: string;
}

export function describeApiFailure(failure: ApiFailure, service: string, model: string, timeoutMs: number): string {
    switch (failure.status) {
        case 401: return `${service} refused the API key (401): check it, or save a new one.`;
        case 403: return `The API key has no access to ${service} (403).`;
        case 404: return `${service} has no model "${model}" for this key (404): check the model setting.`;
        case 429: return `${service} is limiting requests from this key (429): try again in a moment.`;
    }
    if (failure.status !== undefined) {
        return `${service} answered with an error (${failure.status}): ${failure.message}`;
    }
    switch (failure.kind) {
        case 'timeout': return `No answer from ${service} within ${timeoutMs / 1000} s.`;
        case 'connection': return `Could not reach ${service}: ${sentence(failure.message)}`;
        case 'abort': return 'The check was cancelled.';
    }
    return failure.message;
}

const NETWORK_ERRORS: Record<string, string> = {
    ECONNREFUSED: 'the connection was refused',
    ECONNRESET: 'the connection was reset',
    ETIMEDOUT: 'the connection timed out',
    ENOTFOUND: 'the server name was not found',
    EAI_AGAIN: 'the server name could not be looked up',
    EHOSTUNREACH: 'the host is unreachable',
    ENETUNREACH: 'the network is unreachable',
};

/**
 * The reason of a failed `fetch` or SDK connection. Node puts it down the `cause` chain
 * (SDK error → "fetch failed" → ECONNREFUSED, ENOTFOUND…): the first error code, in words when
 * it is a common one, else the deepest message.
 */
export function connectionReason(error: unknown): string {
    let current = error as { code?: unknown; message?: unknown; cause?: unknown } | undefined;
    let message = String((current as { message?: unknown })?.message ?? error);
    for (let depth = 0; current && depth < 5; depth++) {
        if (typeof current.code === 'string') {
            const words = NETWORK_ERRORS[current.code];
            return words ? `${words} (${current.code})` : current.code;
        }
        if (typeof current.message === 'string' && current.message) { message = current.message; }
        current = current.cause as typeof current;
    }
    return message;
}

/** Ends with a full stop, unless it already ends with punctuation. */
export function sentence(text: string): string {
    return /[.!?]$/.test(text) ? text : `${text}.`;
}
