import { GameTimerStatus, SceneStatus } from './../engine/core';
import { Game } from './../engine/game';
import { Scene, GameScene } from './../engine/scene';
import { TestUtil } from './testUtil';

describe('SceneController', () => {
    let game: Game;
    let scnTwo: Scene;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        scnTwo = game.resources.defineScene('scnTwo');
    });

    it('changes the current Scene and passes data to the next', () => {
        (<GameScene>game.defaultScene).startOrResume(game.controller);
        expect(game.controller.scene).toBe(game.defaultScene);
        expect(game.defaultScene.status).toBe(SceneStatus.Running);
        expect(scnTwo.status).toBe(SceneStatus.NotStarted);

        let sceneData = null;
        scnTwo.onStart((self, sc, data) => {
            sceneData = data;
        });

        game.controller.goToScene('scnTwo', { test: 123 });

        expect(game.controller.scene).toBe(scnTwo);
        expect(game.defaultScene.status).toBe(SceneStatus.Suspended);
        expect(scnTwo.status).toBe(SceneStatus.Running);
        expect(sceneData.test).toBe(123);
        
        game.controller.goToScene('default');

        expect(game.controller.scene).toBe(game.defaultScene);
        expect(game.defaultScene.status).toBe(SceneStatus.Running);
        expect(scnTwo.status).toBe(SceneStatus.Suspended);
    });

    it('transitions the current Scene and passes data to the next', done => {
        (<GameScene>game.defaultScene).startOrResume(game.controller);
        expect(game.controller.scene).toBe(game.defaultScene);
        expect(game.defaultScene.status).toBe(SceneStatus.Running);
        expect(scnTwo.status).toBe(SceneStatus.NotStarted);

        let sceneData = null;
        scnTwo.onStart((self, sc, data) => {
            sceneData = data;
        });

        game.controller.transitionToScene('scnTwo', { durationMs: 50 }, { test: 456 }).then(() => {
            expect(game.controller.scene).toBe(scnTwo);
            expect(game.defaultScene.status).toBe(SceneStatus.Suspended);
            expect(scnTwo.status).toBe(SceneStatus.Running);
            expect(sceneData.test).toBe(456);
            done();
        });
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

        (<GameScene>game.controller.scene).startOrResume(game.controller);
        game.controller.step();

        expect(sceneStepCalled).toBeTrue();
    })
})