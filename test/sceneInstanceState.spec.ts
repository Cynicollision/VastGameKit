import { RectBoundary } from './../engine/core/boundaries';
import { Controller } from './../engine/controller';
import { Game } from './../engine/game';
import { Scene } from './../engine/scene';
import { TestUtil } from './testUtil';

describe('manages ActorInstances', () => {
    let testGame: Game;
    let testController: Controller;
    let testScene: Scene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testController = TestUtil.getTestController(testGame);
        testScene = <Scene>testGame.resources.defineScene('testScene');

        const testActor = testGame.resources.defineActor('testActor');
        testActor.setRectBoundary(20, 20);

        const testActor2 = testGame.resources.defineActor('testActor2');
        testActor2.setRectBoundary(20, 20);
    })

    it('creates ActorInstances', () => {
        testScene.instances.create('testActor');
        const layerInstances = testScene.instances.getAll();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('checks if a position is free of any ActorInstances', () => {
        const instance = testScene.instances.create('testActor', {x: 10, y: 10 });

        expect(testScene.instances.isPositionFree(0, 0)).toBeTrue()
        expect(testScene.instances.isPositionFree(20, 20)).toBeFalse();
        expect(testScene.instances.isPositionFree(31, 31)).toBeTrue();
    });

    it('checks if a position is free of solid ActorInstances', () => {
        const instance = testScene.instances.create('testActor', {x: 10, y: 10 });
        instance.actor.solid = true;

        expect(testScene.instances.isPositionFree(20, 20, true)).toBeFalse();

        instance.actor.solid = false;

        expect(testScene.instances.isPositionFree(20, 20, true)).toBeTrue();
    });

    it('gets ActorInstances of a specific type', () => {
        testScene.instances.create('testActor');
        testScene.instances.create('testActor');
        testScene.instances.create('testActor');
        testScene.instances.create('testActor2');
        testScene.instances.create('testActor2');

        expect(testScene.instances.getAll().length).toBe(5);
        expect(testScene.instances.getAll('testActor').length).toBe(3);
        expect(testScene.instances.getAll('testActor2').length).toBe(2);
    });

    xit('gets ActorInstances by depth', () => {

    });

    it('gets ActorInstances at a position', () => {
        const instance1 = testScene.instances.create('testActor', {x: 10, y: 10 });
        instance1.actor.solid = true;

        const instance2 = testScene.instances.create('testActor2', {x: 15, y: 15 });
        instance2.actor.solid = false;

        expect(testScene.instances.getAtPosition(5, 5).length).toBe(0);
        expect(testScene.instances.getAtPosition(20, 20).length).toBe(2);
        expect(testScene.instances.getAtPosition(20, 20, true).length).toBe(1);
    });

    it('gets ActorInstances within a Boundary at a position', () => {
        const instance1 = testScene.instances.create('testActor', {x: 20, y: 20 });
        instance1.actor.solid = true;

        const instance2 = testScene.instances.create('testActor2', {x: 25, y: 25 });
        instance2.actor.solid = false;

        const boundary = new RectBoundary(8, 8);

        expect(testScene.instances.getWithinBoundaryAtPosition(boundary, 4, 4).length).toBe(0);
        expect(testScene.instances.getWithinBoundaryAtPosition(boundary, 16, 16).length).toBe(1);
        expect(testScene.instances.getWithinBoundaryAtPosition(boundary, 19, 19).length).toBe(2);
        expect(testScene.instances.getWithinBoundaryAtPosition(boundary, 19, 19, true).length).toBe(1);
    });
});