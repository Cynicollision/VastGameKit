import { KeyboardInputEvent } from './../engine/core';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

// Patterns the engine is meant to support, checked end to end.
describe('Game scenarios', () => {
    let testGame: Game;

    function step(times: number = 1): void {
        for (let i = 0; i < times; i++) {
            testGame.controller.step();
        }
    }

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });

    it('bounces a round ball off walls by reversing its blocked velocity', () => {
        testGame.construction.actors.add('actWall', { solid: true }).setRectBoundary(16, 64);
        const ball = testGame.construction.actors.add('actBall');
        ball.setCircleBoundary(4, 0, 0);
        ball.onStep(self => {
            if (self.motion.blockedX) {
                self.motion.velocityX = -self.motion.velocityX;
            }
        });

        const instances = testGame.controller.sceneState.instances;
        instances.create('actWall', { x: 0, y: 0 });
        instances.create('actWall', { x: 64, y: 0 });
        const ballInstance = instances.create('actBall', { x: 30, y: 20 });
        testGame.controller.sceneState.startOrResume(testGame.controller);
        step();

        ballInstance.motion.velocityX = 1.5;
        const xs: number[] = [];
        for (let i = 0; i < 80; i++) {
            step();
            xs.push(ballInstance.x);
        }

        // it stays between the walls, touching each in turn.
        expect(Math.min(...xs)).toBe(16);
        expect(Math.max(...xs)).toBe(56);
    });

    it('restarts a level by going to its own Scene', () => {
        let starts = 0;
        testGame.construction.actors.add('actPlayer').setRectBoundary(8, 8);
        const level = testGame.construction.scenes.add('scnLevel', { persistent: false });
        level.onStart(self => {
            starts++;
            self.instances.create('actPlayer', { x: 0, y: 0 });
        });
        level.onStep((self, controller) => {
            if (controller.keyboard.wasPressed('r')) {
                controller.goToScene('scnLevel');
            }
        });

        testGame.controller.goToScene('scnLevel');
        step();
        const player = testGame.controller.sceneState.instances.getAll('actPlayer')[0];
        player.x = 50;

        testGame.controller.onKeyboardEvent(new KeyboardInputEvent('r', 'keydown'));
        step(2);

        const restartedPlayers = testGame.controller.sceneState.instances.getAll('actPlayer');
        expect(starts).toBe(2);
        expect(restartedPlayers.length).toBe(1);
        expect(restartedPlayers[0].x).toBe(0);
    });

    it('keeps a persistent level\'s HUD running after leaving the level and returning', () => {
        let hudSteps = 0;
        testGame.construction.scenes.add('scnHud').onStep(() => hudSteps++);
        testGame.construction.scenes.add('scnMenu');
        testGame.construction.scenes.add('scnLevel', { persistent: true }).onStart(self => self.floatSubScene('scnHud'));

        testGame.controller.goToScene('scnLevel');
        step();
        expect(hudSteps).toBe(1);

        testGame.controller.goToScene('scnMenu');
        step();
        expect(hudSteps).toBe(1);

        testGame.controller.goToScene('scnLevel');
        step();
        expect(hudSteps).toBe(2);
    });
});
