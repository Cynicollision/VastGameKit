import { Game } from './../engine/game';
import { GameScene, Scene } from './../engine/scene';
import { TestUtil } from './testUtil';
import { GameTimer, GameTimerStatus, SceneStatus } from '../engine/core';

describe('SceneController', () => {
    let game: Game;
    let scnTwo: GameScene;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        scnTwo = game.resources.defineScene('scnTwo');
    });

    it('changes the current Scene', () => {
        (<Scene>game.defaultScene).startOrResume(game.controller);
        expect(game.controller.scene).toBe(game.defaultScene);
        expect(game.defaultScene.status).toBe(SceneStatus.Running);
        expect(scnTwo.status).toBe(SceneStatus.NotStarted);

        game.controller.goToScene('scnTwo');

        expect(game.controller.scene).toBe(scnTwo);
        expect(game.defaultScene.status).toBe(SceneStatus.Suspended);
        expect(scnTwo.status).toBe(SceneStatus.Running);
        
        game.controller.goToScene('default');

        expect(game.controller.scene).toBe(game.defaultScene);
        expect(game.defaultScene.status).toBe(SceneStatus.Running);
        expect(scnTwo.status).toBe(SceneStatus.Suspended);
    });

    it('creates, ticks, and restarts GameTimers', () => {
        const timerDurationSteps = 10;
        const timer1 = game.controller.startTimer({ durationSteps: timerDurationSteps });
        let timer2: GameTimer;

        let timer1Called = false;
        let timer2Called = false;

        timer1.onEnd(timer => {
            timer1Called = true;

            timer2 = game.controller.startTimer({ durationSteps: timerDurationSteps });
            timer2.onEnd(timer => {
                timer2Called = true;
                timer2.restart();
            });
        });

        expect(timer1Called).toBeFalse();
        expect(timer2Called).toBeFalse();
        expect(timer1.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps; i++) {
            game.controller.step();
        }
        
        expect(timer1Called).toBeTrue();
        expect(timer2Called).toBeFalse();
        expect(timer1.status).toBe(GameTimerStatus.Elapsed);
        expect(timer2.status).toBe(GameTimerStatus.Ticking);

        for (let i = 0; i < timerDurationSteps; i++) {
            game.controller.step();
        }

        expect(timer2Called).toBeTrue();
        expect(timer2.status).toBe(GameTimerStatus.Ticking);
    });

    it('publishes GameEvents to the current Scene', () => {
        let eventCalled = false;
        let eventData = null;

        game.defaultScene.onGameEvent('testEvent', (self, ev, sc) => {
            eventCalled = true;
            eventData = ev.data;
        });

        expect(eventCalled).toBeFalse();

        game.controller.publishEvent('testEvent', { foo: 'bar' });
        game.controller.step();

        expect(eventCalled).toBeTrue();
        expect(eventData.foo).toBe('bar');
    });

    it('calls the current Scene\'s step', () => {
        let sceneStepCalled = false;
        game.defaultScene.onStep((self, sc) => {
            sceneStepCalled = true;
        });

        expect(sceneStepCalled).toBeFalse();

        (<Scene>game.controller.scene).startOrResume(game.controller);
        game.controller.step();

        expect(sceneStepCalled).toBeTrue();
    })
})