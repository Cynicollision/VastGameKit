// Counts how many fixed-duration steps to run for the real time that has passed.
export class FixedStepClock {
    readonly stepDurationMs: number;
    // the most steps run at once, so a long delay (like a slow frame) doesn't cause a burst of catch-up steps.
    readonly maxSteps: number;

    private previousMs?: number;
    private pendingMs = 0;

    constructor(stepDurationMs: number, maxSteps: number) {
        this.stepDurationMs = stepDurationMs;
        this.maxSteps = maxSteps;
    }

    // The number of steps to run at the given time.
    advance(nowMs: number): number {
        if (this.previousMs !== undefined) {
            this.pendingMs += Math.max(0, nowMs - this.previousMs);
        }
        this.previousMs = nowMs;

        // allows for the rounding error of time between frames adding up to a whole step.
        const steps = Math.floor((this.pendingMs + 0.001) / this.stepDurationMs);

        if (steps > this.maxSteps) {
            this.pendingMs = 0;
            return this.maxSteps;
        }

        this.pendingMs = Math.max(0, this.pendingMs - steps * this.stepDurationMs);
        return steps;
    }

    // Forgets time passed so far, e.g. after being paused.
    reset(): void {
        this.previousMs = undefined;
        this.pendingMs = 0;
    }
}
