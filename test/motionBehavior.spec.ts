import { Direction } from './../engine/core';
import { Instance } from './../engine/state/instance';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('ActorMotionBehavior', () => {
    let testGame: Game;
    let mover: Instance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();

        const actMover = testGame.construction.actors.add('actMover', { solid: true });
        actMover.setRectBoundary(16, 16);
        actMover.useBasicMotionBehavior();

        testGame.construction.actors.add('actWall', { solid: true }).setRectBoundary(16, 16);

        mover = testGame.controller.sceneState.instances.create('actMover', { x: 0, y: 0 });
        testGame.controller.sceneState.startOrResume(testGame.controller);
        testGame.controller.step(); // activates new instances
    });

    it('moves by its speed in its direction', () => {
        mover.motion.speed = 2;
        mover.motion.direction = Direction.Right;

        testGame.controller.step();

        expect(mover.x).toBe(2);
        expect(mover.y).toBe(0);
    });

    it('is not blocked by its own solid Boundary', () => {
        mover.motion.speed = 1;
        mover.motion.direction = Direction.Down;

        testGame.controller.step();

        expect(mover.y).toBe(1);
    });

    it('moves as close as possible to a solid Instance in its way', () => {
        testGame.controller.sceneState.instances.create('actWall', { x: 18, y: 0 });
        testGame.controller.step();

        mover.motion.speed = 4;
        mover.motion.direction = Direction.Right;
        testGame.controller.step();

        expect(mover.x).toBe(2);
    });

    it('does not move diagonally into the corner of a solid Instance', () => {
        mover.actor.solid = false;
        testGame.controller.sceneState.instances.create('actWall', { x: 17, y: 17 });
        testGame.controller.step();

        mover.motion.speed = Math.SQRT2 * 2;
        mover.motion.direction = 45;
        testGame.controller.step();

        expect(mover.collidesWith(testGame.controller.sceneState.instances.getAll('actWall')[0])).toBeFalse();
    });
});
