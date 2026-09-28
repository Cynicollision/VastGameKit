import { GameTimer, GameTimerSet, GameTimerStatus } from './../engine/core';

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
describe('GameTimerSet', () => {

    it('drops timers once elapsed', () => {
        const timers = new GameTimerSet();
        timers.start({ durationSteps: 2 });

        timers.step();
        expect(timers.count).toBe(1);

        timers.step();
        expect(timers.count).toBe(0);
    });

    it('ticks a dropped timer again once it is reset', () => {
        const timers = new GameTimerSet();
        const timer = timers.start({ durationSteps: 1 });
        let endCount = 0;
        timer.onEnd(() => endCount++);

        timers.step();
        timer.reset();
        timers.step();

        expect(endCount).toBe(2);
    });

    it('does not tick a timer twice when it is reset as it ends', () => {
        const timers = new GameTimerSet();
        const timer = timers.start({ durationSteps: 2 });
        let endCount = 0;
        timer.onEnd(self => {
            endCount++;
            self.reset();
        });

        for (let i = 0; i < 4; i++) {
            timers.step();
        }

        expect(endCount).toBe(2);
        expect(timers.count).toBe(1);
    });
});
