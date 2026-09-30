import { GameTimerStatus, SceneStatus } from './../engine/core';
import { Scene } from './../engine/structure/scene';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('SceneController', () => {
    let game: Game;
    let scnTwo: Scene;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        scnTwo = game.construction.scenes.add('scnTwo');
    });

    function stepFor(ms: number): void {
        const steps = Math.ceil(ms / game.controller.stepDurationMs);
        for (let i = 0; i < steps; i++) {
            game.controller.step();
        }
    }

    it('changes the current SceneState and passes data to the next', () => {
        expect(game.controller.sceneState.status).toBe(SceneStatus.NotStarted);

        game.controller.sceneState.startOrResume(game.controller);
        expect(game.controller.sceneState.scene).toBe(game.defaultScene);
        expect(game.controller.sceneState.status).toBe(SceneStatus.Running);

        let sceneData: any = null;
        scnTwo.onStart((self, sc, data) => {
            sceneData = data;
        });

        let originalSceneState = game.controller.sceneState;

        game.controller.goToScene('scnTwo', { test: 123 });

        expect(originalSceneState.status).toBe(SceneStatus.Suspended);
        expect(game.controller.sceneState.scene).toBe(scnTwo);
        expect(game.controller.sceneState.status).toBe(SceneStatus.Running);
        expect(sceneData.test).toBe(123);
        
        game.controller.goToScene('default');

        expect(game.controller.sceneState.scene).toBe(game.defaultScene);
    });

    it('transitions the current SceneState and passes data to the next', done => {
        expect(game.controller.sceneState.status).toBe(SceneStatus.NotStarted);

        game.controller.sceneState.startOrResume(game.controller);
        expect(game.controller.sceneState.scene).toBe(game.defaultScene);
        expect(game.controller.sceneState.status).toBe(SceneStatus.Running);

        let sceneData: any = null;
        scnTwo.onStart((self, sc, data) => {
            sceneData = data;
        });

        let originalSceneState = game.controller.sceneState;

        game.controller.transitionToScene('scnTwo', { durationMs: 50 }, { test: 456 }).then(() => {
            expect(originalSceneState.status).toBe(SceneStatus.Suspended);
            expect(game.controller.sceneState.scene).toBe(scnTwo);
            expect(game.controller.sceneState.status).toBe(SceneStatus.Running);
            expect(sceneData.test).toBe(456);
            done();
        });

        stepFor(50 * 2 + 50);
    });

    it('changes Scenes halfway through a transition, advancing only as the game steps', () => {
        game.controller.sceneState.startOrResume(game.controller);
        let completed = false;

        game.controller.transitionToScene('scnTwo', { durationMs: 200 }).then(() => completed = true);

        stepFor(150);
        expect(game.controller.sceneState.scene).toBe(game.defaultScene);

        stepFor(70);
        expect(game.controller.sceneState.scene).toBe(scnTwo);

        return Promise.resolve().then(() => {
            expect(completed).toBeFalse();
            stepFor(250);
        }).then(() => {
            expect(completed).toBeTrue();
        });
    });

    it('ignores a transition requested while another is in progress', done => {
        game.controller.sceneState.startOrResume(game.controller);
        const scnThree = game.construction.scenes.add('scnThree');

        let scnTwoStarts = 0;
        let scnThreeStarts = 0;
        scnTwo.onStart(() => scnTwoStarts++);
        scnThree.onStart(() => scnThreeStarts++);

        const first = game.controller.transitionToScene('scnTwo', { durationMs: 20 });
        const second = game.controller.transitionToScene('scnThree', { durationMs: 20 });

        expect(second).toBe(first);

        first.then(() => {
            expect(game.controller.sceneState.scene).toBe(scnTwo);
            expect(scnTwoStarts).toBe(1);
            expect(scnThreeStarts).toBe(0);
            done();
        });

        stepFor(20 * 2 + 50);
    });

    it('keeps Scene timers paused while their Scene is suspended', () => {
        game.construction.scenes.add('scnPersistent', { persistent: true });
        game.controller.sceneState.startOrResume(game.controller);
        game.controller.goToScene('scnPersistent');
        let ended = false;
        game.controller.sceneState.startTimer({ durationSteps: 2 }).onEnd(() => ended = true);

        game.controller.step();
        game.controller.goToScene('scnTwo');
        game.controller.step();
        game.controller.step();
        expect(ended).toBeFalse();

        game.controller.goToScene('scnPersistent');
        game.controller.step();
        expect(ended).toBeTrue();
    });

    it('keeps Scene timers paused while their Scene is paused', () => {
        game.controller.sceneState.startOrResume(game.controller);
        let ended = false;
        game.controller.sceneState.startTimer({ durationSteps: 1 }).onEnd(() => ended = true);

        game.controller.sceneState.paused = true;
        game.controller.step();
        expect(ended).toBeFalse();

        game.controller.sceneState.paused = false;
        game.controller.step();
        expect(ended).toBeTrue();
    });

    it('starts a GameTimer', () => {
        const timerDurationSteps = 10;
        const timer = game.controller.startTimer({ durationSteps: timerDurationSteps });

        expect(timer).toBeDefined();
        expect(timer.durationSteps).toBe(timerDurationSteps);
        expect(timer.status).toBe(GameTimerStatus.Ticking);
    });

    it('publishes GameEvents to the current Scene', () => {
        let eventCalled = false;
        let eventData: any = null;

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

        game.controller.sceneState.startOrResume(game.controller);
        game.controller.step();

        expect(sceneStepCalled).toBeTrue();
    })
})