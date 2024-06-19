import { InstanceStatus } from '../engine/core';
import { SceneInstanceState } from '../engine/scene/instanceState';
import { RectBoundary } from './../engine/core/boundaries';
import { Game } from './../engine/game';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { TestUtil } from './testUtil';

describe('manages ActorInstances', () => {
    let testGame: Game;
    let testInstanceState: SceneInstanceState;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testInstanceState = new SceneInstanceState(testGame.controller);

        const testActor = testGame.resources.defineActor('testActor');
        testActor.setRectBoundary(20, 20);

        const testActor2 = testGame.resources.defineActor('testActor2');
        testActor2.setRectBoundary(20, 20);
    });

    it('creates ActorInstances', () => {
        testInstanceState.create('testActor', 0, 0);
        const layerInstances = testInstanceState.getAll();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('enumerates a callback over its ActorInstances', () => {
        testInstanceState.create('testActor', 0, 0);
        testInstanceState.create('testActor', 0, 0);
        testInstanceState.create('testActor', 0, 0);

        testInstanceState.forEach(instance => instance.state.foo = 'bar');
        testInstanceState.forEach(instance => expect(instance.state.foo).toBe('bar'));
    });

    it('checks if a position is free of any ActorInstances', () => {
        testInstanceState.create('testActor', 10, 10);

        expect(testInstanceState.isPositionFree(0, 0)).toBeTrue()
        expect(testInstanceState.isPositionFree(20, 20)).toBeFalse();
        expect(testInstanceState.isPositionFree(31, 31)).toBeTrue();
    });

    it('checks if a position is free of solid ActorInstances', () => {
        const instance = testInstanceState.create('testActor', 10, 10);
        instance.actor.solid = true;

        expect(testInstanceState.isPositionFree(20, 20, true)).toBeFalse();

        instance.actor.solid = false;

        expect(testInstanceState.isPositionFree(20, 20, true)).toBeTrue();
    });

    it('gets ActorInstances of a given Actor type', () => {
        testInstanceState.create('testActor', 0, 0);
        testInstanceState.create('testActor', 0, 0);
        testInstanceState.create('testActor', 0, 0);
        testInstanceState.create('testActor2', 0, 0);
        testInstanceState.create('testActor2', 0, 0);

        expect(testInstanceState.getAll().length).toBe(5);
        expect(testInstanceState.getAll('testActor').length).toBe(3);
        expect(testInstanceState.getAll('testActor2').length).toBe(2);
    });

    xit('TODO draws ActorInstances by depth', () => {
        // utilize MockCanvas drawn image order
    });

    it('gets ActorInstances at a position', () => {
        const instance1 = testInstanceState.create('testActor', 10, 10);
        instance1.actor.solid = true;

        const instance2 = testInstanceState.create('testActor2', 15, 15);
        instance2.actor.solid = false;

        expect(testInstanceState.getAtPosition(5, 5).length).toBe(0);
        expect(testInstanceState.getAtPosition(20, 20).length).toBe(2);
        expect(testInstanceState.getAtPosition(20, 20, true).length).toBe(1);
    });

    it('gets ActorInstances within a Boundary at a position', () => {
        const instance1 = testInstanceState.create('testActor', 20, 20);
        instance1.actor.solid = true;

        const instance2 = testInstanceState.create('testActor2', 25, 25);
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

            const testActor = testGame.resources.getActor('testActor');
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
            const instance = testInstanceState.create('testActor', 0, 0);

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.New);
            testInstanceState.step(testGame.controller);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(InstanceStatus.Active);
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testInstanceState.create('testActor', 0, 0);
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
            const instance = testInstanceState.create('testActor', 0, 0);
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