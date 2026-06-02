/**
 * CircuitBreaker — protects each LLM provider from cascading failures.
 *
 * State machine (per provider instance):
 *   CLOSED  → normal operation
 *   OPEN    → after 3 failures within 5-min window; blocks calls for 10 min
 *   HALF-OPEN → after cooldown; next call is a probe; success → CLOSED, fail → OPEN again
 */

const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 5 * 60_000;   // 5 minutes
const COOLDOWN_MS = 10 * 60_000;         // 10 minutes

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
    private _state: State = 'CLOSED';
    private _failures = 0;
    private _firstFailureAt = 0;
    private _openUntil = 0;

    get state(): State {
        this._tick();
        return this._state;
    }

    /** Returns true when the circuit is open (calls should be skipped). */
    isOpen(): boolean {
        this._tick();
        return this._state === 'OPEN';
    }

    /** Call after a successful provider response. */
    recordSuccess(): void {
        this._state = 'CLOSED';
        this._failures = 0;
        this._firstFailureAt = 0;
    }

    /** Call after any provider error / timeout. */
    recordFailure(): void {
        this._tick();
        const now = Date.now();

        if (this._state === 'HALF_OPEN') {
            // Probe failed — re-open for another full cooldown
            this._state = 'OPEN';
            this._openUntil = now + COOLDOWN_MS;
            return;
        }

        if (this._failures === 0) {
            this._firstFailureAt = now;
        }

        this._failures++;

        if (this._failures >= FAILURE_THRESHOLD) {
            this._state = 'OPEN';
            this._openUntil = now + COOLDOWN_MS;
        }
    }

    /** Advance state machine based on elapsed time. */
    private _tick(): void {
        if (this._state !== 'OPEN') {
            // Reset failure counter if window expired
            if (
                this._failures > 0 &&
                Date.now() - this._firstFailureAt > FAILURE_WINDOW_MS
            ) {
                this._failures = 0;
                this._firstFailureAt = 0;
            }
            return;
        }

        if (Date.now() >= this._openUntil) {
            this._state = 'HALF_OPEN';
        }
    }
}
