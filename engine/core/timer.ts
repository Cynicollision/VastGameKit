import { GameTimerStatus } from './enum';

type GameTimerElapsedCallback = {
    (self: GameTimer): void;
};

export type GameTimerOptions = {
    durationSteps: number;
};

export interface Timer {
    readonly durationSteps: number;
    readonly status: GameTimerStatus;
    reset(): void;
}

export class GameTimer implements Timer {
    private readonly onRestart?: (timer: GameTimer) => void;
    private _callbacks: GameTimerElapsedCallback[] = [];
    private _current = 0;

    private _durationSteps: number;
    get durationSteps() { return this._durationSteps; }

    private _status = GameTimerStatus.Ticking;
    get status() { return this._status; }

    static start(options: GameTimerOptions, onRestart?: (timer: GameTimer) => void): GameTimer {
        return new GameTimer(options, onRestart);
    }

    private constructor(options: GameTimerOptions, onRestart?: (timer: GameTimer) => void) {
        this._durationSteps = options.durationSteps;
        this.onRestart = onRestart;
    }

    end(): void {
        this._status = GameTimerStatus.Elapsed;
    }

    reset(): void {
        const wasElapsed = this._status === GameTimerStatus.Elapsed;
        this._current = 0;
        this._status = GameTimerStatus.Ticking;

        if (wasElapsed && this.onRestart) {
            this.onRestart(this);
        }
    }

    tick(): void {
        if (this._status === GameTimerStatus.Elapsed) {
            return;
        }

        this._current++;

        if (this._current >= this._durationSteps) {
            this.end();
            this._callbacks.forEach(callback => callback(this));
        }
    }

    onEnd(callback: GameTimerElapsedCallback): void {
        this._callbacks.push(callback);
    }
}

// Ticks a group of GameTimers, dropping them once elapsed. A dropped GameTimer that is reset rejoins the group.
export class GameTimerSet {
    private timers: GameTimer[] = [];

    get count(): number { return this.timers.length; }

    start(options: GameTimerOptions): GameTimer {
        const timer = GameTimer.start(options, restarted => {
            if (!this.timers.includes(restarted)) {
                this.timers.push(restarted);
            }
        });
        this.timers.push(timer);

        return timer;
    }

    step(): void {
        // timers started by callbacks during this step begin ticking next step.
        const count = this.timers.length;
        for (let i = 0; i < count; i++) {
            this.timers[i].tick();
        }

        this.timers = this.timers.filter(timer => timer.status !== GameTimerStatus.Elapsed);
    }
}
