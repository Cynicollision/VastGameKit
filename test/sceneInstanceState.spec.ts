import { InstanceStatus } from './../engine/core';
import { RectBoundary } from './../engine/core/boundaries';
import { Game } from './../engine/game';
import { SceneInstanceState } from './../engine/scene/sceneInstanceState';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestUtil } from './testUtil';

describe('manages ActorInstances', () => {
    const testSprite1 = TestUtil.getTestSprite();
    const testSprite2 = TestUtil.getTestSprite2();

    let testGame: Game;
    let testInstanceState: SceneInstanceState;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testInstanceState = new SceneInstanceState(testGame.controller);

        const testActor = testGame.construct.defineActor('testActor', { sprite: testSprite1 });
        testActor.setRectBoundary(20, 20);

        const testActor2 = testGame.construct.defineActor('testActor2', { sprite: testSprite2 });
        testActor2.setRectBoundary(20, 20);
    });

    it('creates ActorInstances', () => {
        testInstanceState.create('testActor');
        const layerInstances = testInstanceState.getAll();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('enumerates a callback over its ActorInstances', () => {
        testInstanceState.create('testActor');
        testInstanceState.create('testActor');
        testInstanceState.create('testActor');

        testInstanceState.forEach(instance => instance.state.foo = 'bar');
        testInstanceState.forEach(instance => expect(instance.state.foo).toBe('bar'));
    });

    it('checks if a position is free of any ActorInstances', () => {
        testInstanceState.create('testActor', { x: 10, y: 10 });

        expect(testInstanceState.isPositionFree(0, 0)).toBeTrue()
        expect(testInstanceState.isPositionFree(20, 20)).toBeFalse();
        expect(testInstanceState.isPositionFree(31, 31)).toBeTrue();
    });

    it('checks if a position is free of solid ActorInstances', () => {
        const instance = testInstanceState.create('testActor', { x: 10, y: 10 });
        instance.actor.solid = true;

        expect(testInstanceState.isPositionFree(20, 20, true)).toBeFalse();

        instance.actor.solid = false;

        expect(testInstanceState.isPositionFree(20, 20, true)).toBeTrue();
    });

    it('gets ActorInstances of a given Actor type', () => {
        testInstanceState.create('testActor');
        testInstanceState.create('testActor');
        testInstanceState.create('testActor');
        testInstanceState.create('testActor2');
        testInstanceState.create('testActor2');

        expect(testInstanceState.getAll().length).toBe(5);
        expect(testInstanceState.getAll('testActor').length).toBe(3);
        expect(testInstanceState.getAll('testActor2').length).toBe(2);
    });

    it('draws ActorInstances by depth', () => {
        const mockCanvas = <MockGameCanvas>testGame.canvas;
        const inst1 = testInstanceState.create('testActor');
        const inst2 = testInstanceState.create('testActor2');
        testInstanceState.step(testGame.controller);

        inst1.depth = 10;
        inst2.depth = 20;
        testInstanceState.draw(mockCanvas, testGame.controller);
    
        expect(mockCanvas.drawnImages.length).toBe(2);
        expect(mockCanvas.drawnImages[0].src).toBe(testSprite2.image);
        expect(mockCanvas.drawnImages[1].src).toBe(testSprite1.image);

        mockCanvas.clear();

        inst1.depth = 20;
        inst2.depth = 10;
        testInstanceState.draw(mockCanvas, testGame.controller);
    
        expect(mockCanvas.drawnImages.length).toBe(2);
        expect(mockCanvas.drawnImages[0].src).toBe(testSprite1.image);
        expect(mockCanvas.drawnImages[1].src).toBe(testSprite2.image);
    });

    it('gets ActorInstances at a position', () => {
        const instance1 = testInstanceState.create('testActor', { x: 10, y: 10 });
        instance1.actor.solid = true;

        const instance2 = testInstanceState.create('testActor2', { x: 15, y: 15 });
        instance2.actor.solid = false;

        expect(testInstanceState.getAtPosition(5, 5).length).toBe(0);
        expect(testInstanceState.getAtPosition(20, 20).length).toBe(2);
        expect(testInstanceState.getAtPosition(20, 20, true).length).toBe(1);
    });

    it('gets ActorInstances within a Boundary at a position', () => {
        const instance1 = testInstanceState.create('testActor', { x: 20, y: 20 });
        instance1.actor.solid = true;

        const instance2 = testInstanceState.create('testActor2', { x: 25, y: 25 });
        instance2.actor.solid = false;

        const boundary = new RectBoundary(8, 8);

        expect(testInstanceState.getWithinBoundaryAtPosition(boundary, 4, 4).length).toBe(0);
        expect(testInstanceState.getWithinBoundaryAtPosition(boundary, 16, 16).length).toBe(1);
        expect(testInstanceState.getWithinBoundaryAtPosition(boundary, 19, 19).length).toBe(2);
        expect(testInstanceState.getWithinBoundaryAtPosition(boundary, 19, 19, true).length).toBe(1);
    });

    describe('steps its Instances', () => {
        let actorOnCreatedCalled: boolean;
        let actorOnStepCalled: boolean;
        let actorOnDestroyCalled: boolean;

        beforeEach(() => {
            actorOnCreatedCalled = false;
            actorOnStepCalled = false;
            actorOnDestroyCalled = false;

            const testActor = testGame.construct.getActor('testActor');
            testActor.setRectBoundary(20, 20);
            testActor.onCreate((self, state) => {
                actorOnCreatedCalled = true;
            });
            testActor.onStep((self, state) => {
                actorOnStepCalled = true;
            });
                
            testActor.onDestroy((self, state) => {
                actorOnDestroyCalled = true;
            });
        });

        it('activates new ActorInstances and calls Actor callbacks', () => {
            const instance = testInstanceState.create('testActor');

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.New);
            testInstanceState.step(testGame.controller);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(InstanceStatus.Active);
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testInstanceState.create('testActor');
            const mockBehavior = new MockActorInstanceBehavior();
            instance.useBehavior(mockBehavior);
            testInstanceState.step(testGame.controller);

            expect(actorOnStepCalled).toBeFalse();
            expect(mockBehavior.beforeStepCallCount).toBe(0);
            expect(mockBehavior.afterStepCallCount).toBe(0);

            testInstanceState.step(testGame.controller);

            expect(actorOnStepCalled).toBeTrue();
            expect(mockBehavior.beforeStepCallCount).toBe(1);
            expect(mockBehavior.afterStepCallCount).toBe(1);
        });

        it('deletes destoyed ActorInstances and calls Actor callbacks', () => {
            const instance = testInstanceState.create('testActor');
            instance.destroy();
            expect(actorOnDestroyCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.Destroyed);
            expect(testInstanceState.getAll().length).toBe(1);

            testInstanceState.step(testGame.controller);

            expect(actorOnDestroyCalled).toBeTrue();
            expect(testInstanceState.getAll().length).toBe(0);
        });
    });
});