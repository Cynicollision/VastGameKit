import { GameTimer, GameTimerStatus } from './../engine/core';

describe('GameTimer', () => {
    const timerDurationSteps = 10;

    it('ticks until it is elapsed', () => {
        const timer = GameTimer.start({ durationSteps: timerDurationSteps });

        let timerCalled = false;

        timer.onEnd(timer => timerCalled = true);

        expect(timerCalled).toBeFalse();
        expect(timer.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps / 2; i++) {
            timer.tick();
        }

        expect(timerCalled).toBeFalse();
        expect(timer.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps / 2; i++) {
            timer.tick();
        }
        
        expect(timerCalled).toBeTrue();
        expect(timer.status).toBe(GameTimerStatus.Elapsed);
    });

    it('can be reset', () => {
        const timer = GameTimer.start({ durationSteps: timerDurationSteps });

        let timerCalledTimes = 0;

        timer.onEnd(timer => timerCalledTimes++);

        expect(timer.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps; i++) {
            timer.tick();
        }

        expect(timerCalledTimes).toBe(1);
        expect(timer.status).toBe(GameTimerStatus.Elapsed);

        timer.reset();

        expect(timer.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps; i++) {
            timer.tick();
        }

        expect(timerCalledTimes).toBe(2);
        expect(timer.status).toBe(GameTimerStatus.Elapsed);
    });
});