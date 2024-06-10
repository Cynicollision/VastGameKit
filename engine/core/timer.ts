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
    private _callbacks: GameTimerElapsedCallback[] = [];
    private _current = 0;

    private _durationSteps: number;
    get durationSteps() { return this._durationSteps; }

    private _status = GameTimerStatus.Ticking;
    get status() { return this._status; }

    static start(options: GameTimerOptions): GameTimer {
        return new GameTimer(options);
    }

    private constructor(options: GameTimerOptions) {
        this._durationSteps = options.durationSteps;
    }

    end(): void {
        this._status = GameTimerStatus.Elapsed;
    }

    reset(): void {
        this._current = 0;
        this._status = GameTimerStatus.Ticking;
    }

    tick(): void {
        if (this._status === GameTimerStatus.Elapsed) {
            return;
        }

        this._current++;

        if (this._current === this._durationSteps) {
            this.end();
            this._callbacks.forEach(callback => callback(this));
        }
    }

    onEnd(callback: GameTimerElapsedCallback): void {
        this._callbacks.push(callback);
    }
}