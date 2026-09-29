import { FixedStepClock } from './../engine/core';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('FixedStepClock', () => {
    let clock: FixedStepClock;

    beforeEach(() => {
        clock = new FixedStepClock(10, 5);
    });

    it('counts no steps until time has passed', () => {
        expect(clock.advance(1000)).toBe(0);
    });

    it('counts whole steps and carries over the remaining time', () => {
        clock.advance(0);

        expect(clock.advance(25)).toBe(2);
        expect(clock.advance(30)).toBe(1);
        expect(clock.advance(39)).toBe(0);
    });

    it('counts steps of frames at the same rate despite rounding', () => {
        const sixtyFps = new FixedStepClock(1000 / 60, 10);
        let steps = 0;
        sixtyFps.advance(0);

        for (let frame = 1; frame <= 600; frame++) {
            steps += sixtyFps.advance(frame * 1000 / 60);
        }

        expect(steps).toBe(600);
    });

    it('limits the steps after a long delay and drops the rest', () => {
        clock.advance(0);

        expect(clock.advance(1000)).toBe(5);
        expect(clock.advance(1010)).toBe(1);
    });

    it('forgets time passed before being reset', () => {
        clock.advance(0);
        clock.reset();

        expect(clock.advance(500)).toBe(0);
        expect(clock.advance(510)).toBe(1);
    });
});

describe('Game loop', () => {
    let testGame: Game;
    let steps: number;

    function runFrames(fromMs: number, frames: number): void {
        for (let i = 0; i <= frames; i++) {
            testGame.frame(fromMs + i * testGame.controller.stepDurationMs);
        }
    }

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        steps = 0;
        spyOn(testGame.controller, 'step').and.callFake(() => { steps++; });
    });

    it('steps once per step duration', () => {
        runFrames(0, 10);

        expect(steps).toBe(10);
    });

    it('draws but does not step while paused', () => {
        const draw = spyOn(testGame.controller, 'draw');
        testGame.pause();

        runFrames(0, 10);

        expect(testGame.paused).toBeTrue();
        expect(steps).toBe(0);
        expect(draw).toHaveBeenCalledTimes(11);
    });

    it('does not catch up on time spent paused', () => {
        runFrames(0, 5);
        testGame.pause();
        runFrames(1000, 60);
        testGame.resume();

        runFrames(5000, 5);

        expect(steps).toBe(10);
    });

    it('pauses while hidden', () => {
        testGame.setHidden(true);
        runFrames(0, 10);
        testGame.setHidden(false);
        runFrames(1000, 10);

        expect(steps).toBe(10);
    });

    it('keeps running while hidden if configured to', () => {
        testGame = TestUtil.getTestGame({ canvasElementId: 'test', runWhileHidden: true });
        spyOn(testGame.controller, 'step').and.callFake(() => { steps++; });

        testGame.setHidden(true);
        runFrames(0, 10);

        expect(steps).toBe(10);
    });
});
