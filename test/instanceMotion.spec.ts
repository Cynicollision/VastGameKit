import { Direction } from './../engine/core';
import { InstanceMotion } from './../engine/state/motion';
import { Instance } from './../engine/state/instance';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('Instance motion', () => {
    let testGame: Game;
    let mover: Instance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();

        testGame.construction.actors.add('actMover', { solid: true }).setRectBoundary(16, 16);
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

    it('moves on the same step its speed is set in onStep', () => {
        testGame.construction.actors.get('actMover').onStep(self => {
            self.motion.speed = 3;
            self.motion.direction = Direction.Down;
        });

        testGame.controller.step();

        expect(mover.y).toBe(3);
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

    it('is only blocked by solid Instances in its own Scene', () => {
        // a wall in the main Scene, where a sub Scene's mover would be.
        testGame.controller.sceneState.instances.create('actWall', { x: 18, y: 0 });
        testGame.construction.scenes.add('scnSub');
        const subScene = testGame.controller.sceneState.embedSubScene('scnSub');
        const subMover = subScene.sceneState.instances.create('actMover', { x: 0, y: 0 });
        testGame.controller.step();

        subMover.motion.speed = 4;
        subMover.motion.direction = Direction.Right;
        testGame.controller.step();

        expect(subMover.x).toBe(4);
    });
});

describe('InstanceMotion', () => {
    let motion: InstanceMotion;
    const open = (): boolean => true;

    beforeEach(() => {
        motion = new InstanceMotion();
    });

    it('sets velocity from speed and direction, and the reverse', () => {
        motion.speed = 2;
        motion.direction = Direction.Down;
        expect(motion.velocityX).toBeCloseTo(0);
        expect(motion.velocityY).toBeCloseTo(2);

        motion.velocityX = -2;
        motion.velocityY = 0;
        expect(motion.speed).toBe(2);
        expect(motion.direction).toBe(Direction.Left);
    });

    it('keeps its direction while its speed is 0', () => {
        motion.direction = Direction.Up;
        motion.speed = 0;
        motion.speed = 3;

        expect(motion.direction).toBe(Direction.Up);
        expect(motion.velocityY).toBeCloseTo(-3);
    });

    it('moves whole pixels, carrying fractions over to later steps', () => {
        const position = { x: 0, y: 0 };
        motion.velocityX = 0.25;
        motion.velocityY = -1.5;
        const xs: number[] = [];

        for (let i = 0; i < 8; i++) {
            motion.move(position, open);
            xs.push(position.x);
        }

        expect(xs.every(x => Number.isInteger(x))).toBeTrue();
        expect(position).toEqual({ x: 2, y: -12 });
    });

    it('stops', () => {
        const position = { x: 0, y: 0 };
        motion.velocityX = 0.5;
        motion.move(position, open);
        motion.stop();
        motion.move(position, open);

        expect([motion.speed, position.x]).toEqual([0, 1]);
    });
});

describe('Instance motion against solids', () => {
    let testGame: Game;
    let mover: Instance;

    function step(times: number = 1): void {
        for (let i = 0; i < times; i++) {
            testGame.controller.step();
        }
    }

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actMover').setRectBoundary(16, 16);
        testGame.construction.actors.add('actWall', { solid: true }).setRectBoundary(16, 16);

        mover = testGame.controller.sceneState.instances.create('actMover', { x: 0, y: 0 });
        // a floor under the mover, and a wall to its right.
        testGame.controller.sceneState.instances.create('actWall', { x: 0, y: 32 });
        testGame.controller.sceneState.instances.create('actWall', { x: 40, y: 0 });
        testGame.controller.sceneState.startOrResume(testGame.controller);
        step();
    });

    it('lands on a solid under it, reporting it is blocked while resting there', () => {
        const blocked: boolean[] = [];
        testGame.construction.actors.get('actMover').onStep(self => {
            // gravity, with the vertical velocity cleared on landing.
            self.motion.velocityY = self.motion.blockedY ? 0.3 : self.motion.velocityY + 0.3;
            blocked.push(self.motion.blockedY);
        });

        step(30);

        expect(mover.y).toBe(16);
        expect(blocked.slice(-10).every(b => b)).toBeTrue();
    });

    it('reports being blocked horizontally when it reaches a wall', () => {
        mover.motion.velocityX = 3;

        step(7);
        expect([mover.x, mover.motion.blockedX]).toEqual([21, false]);

        step();
        expect([mover.x, mover.motion.blockedX]).toEqual([24, true]);
    });

    it('can check whether a position is free of solids', () => {
        expect(mover.isPlaceFree(0, 16)).toBeTrue();
        expect(mover.isPlaceFree(0, 17)).toBeFalse();
        expect(mover.isPlaceFree(25, 0)).toBeFalse();
    });
});

describe('Instance collisions', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actA').setRectBoundary(16, 16);
        testGame.construction.actors.add('actB').setRectBoundary(16, 16);
        testGame.controller.sceneState.startOrResume(testGame.controller);
    });

    it('are detected for Instances that are not moving', () => {
        const collisions: Instance[] = [];
        testGame.construction.actors.get('actA').onCollision('actB', (self, other) => collisions.push(other));

        testGame.controller.sceneState.instances.create('actA', { x: 0, y: 0 });
        const b = testGame.controller.sceneState.instances.create('actB', { x: 8, y: 8 });
        testGame.controller.step(); // activates new instances
        testGame.controller.step();

        expect(collisions).toEqual([b]);
    });

    it('are not detected with destroyed Instances', () => {
        let collisionCount = 0;
        testGame.construction.actors.get('actA').onCollision('actB', () => collisionCount++);

        testGame.controller.sceneState.instances.create('actA', { x: 0, y: 0 });
        const b = testGame.controller.sceneState.instances.create('actB', { x: 8, y: 8 });
        testGame.controller.step();
        b.destroy();
        testGame.controller.step();

        expect(collisionCount).toBe(0);
    });
});
