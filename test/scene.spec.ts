import { RectBoundary } from './../engine/actor/boundaries/rectangleBoundary';
import { InstanceStatus, SceneStatus } from './../engine/core/enum';
import { GameEvent, KeyboardInputEvent, PointerInputEvent } from './../engine/core/events';
import { Game } from './../engine/game';
import { Controller } from './../engine/scene/controller';
import { Scene } from './../engine/scene/scene';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    let testGame: Game;
    let testScene: Scene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testScene = <Scene>testGame.defineScene('testScene');

        testGame.defineActor('testActor').setRectBoundary(20, 20);
        testGame.defineActor('testActor2').setRectBoundary(20, 20);
    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);
        });

        it('when NotStarted, on initialize, changes to Starting', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Starting);
        });

        it('when Starting, on scene start, changes to Running', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.start(sc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });

        it('when Running, on scene suspend, changes to Suspended', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.suspend(sc);

            expect(testScene.status).toBe(SceneStatus.Suspended);
        });

        it('when Suspended, on initialize, if not persistent, changes to Starting', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.options.persistent = false;
            testScene.suspend(sc);
            expect(testScene.status).toBe(SceneStatus.Suspended);

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Starting);
        });

        it('when Suspended, on initialize, if persistent, changes to Resuming', () => {
            testScene.options.persistent = true;
            testScene.suspend(TestUtil.getTestController(testGame));

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Resuming);
        });

        it('when Resuming, on scene start, changes to Running', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.options.persistent = true;
            testScene.suspend(sc);
            testScene.init();
            expect(testScene.status).toBe(SceneStatus.Resuming);

            testScene.start(sc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });
    });

    describe('manages ActorInstances', () => {

        it('creates ActorInstances', () => {
            testScene.createInstance('testActor', 0, 0);
            const layerInstances = testScene.getInstances();
    
            expect(layerInstances.length).toBe(1);
            expect(layerInstances[0].actor.name).toBe('testActor');
        });
    
        it('checks if a position is free of any ActorInstances', () => {
            const instance = testScene.createInstance('testActor', 10, 10);
    
            expect(testScene.isPositionFree(0, 0)).toBeTrue()
            expect(testScene.isPositionFree(20, 20)).toBeFalse();
            expect(testScene.isPositionFree(31, 31)).toBeTrue();
        });
    
        it('checks if a position is free of solid ActorInstances', () => {
            const instance = testScene.createInstance('testActor', 10, 10);
            instance.actor.solid = true;
    
            expect(testScene.isPositionFree(20, 20, true)).toBeFalse();
    
            instance.actor.solid = false;
    
            expect(testScene.isPositionFree(20, 20, true)).toBeTrue();
        });
    
        it('gets ActorInstances at a position', () => {
            const instance1 = testScene.createInstance('testActor', 10, 10);
            instance1.actor.solid = true;
    
            const instance2 = testScene.createInstance('testActor2', 15, 15);
            instance2.actor.solid = false;
    
            expect(testScene.getInstancesAtPosition(5, 5).length).toBe(0);
            expect(testScene.getInstancesAtPosition(20, 20).length).toBe(2);
            expect(testScene.getInstancesAtPosition(20, 20, true).length).toBe(1);
        });
    
        it('gets ActorInstances within a Boundary at a position', () => {
            const instance1 = testScene.createInstance('testActor', 20, 20);
            instance1.actor.solid = true;
    
            const instance2 = testScene.createInstance('testActor2', 25, 25);
            instance2.actor.solid = false;
    
            const boundary = new RectBoundary(8, 8);
    
            expect(testScene.getInstancesWithinBoundaryAtPosition(boundary, 4, 4).length).toBe(0);
            expect(testScene.getInstancesWithinBoundaryAtPosition(boundary, 16, 16).length).toBe(1);
            expect(testScene.getInstancesWithinBoundaryAtPosition(boundary, 19, 19).length).toBe(2);
            expect(testScene.getInstancesWithinBoundaryAtPosition(boundary, 19, 19, true).length).toBe(1);
        });
    });

    describe('lifecycle callbacks', () => {
        let sc: Controller;

        beforeEach(() => {
            sc = TestUtil.getTestController(testGame);
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testScene.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testScene.draw(testGame.canvas, sc);

            expect(drawCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testScene.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testScene.handleGameEvent(GameEvent.init('testEvent'), sc);

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines a pointer event handler callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testScene.onPointerInput('pointertest', (self, ev, sc) => {
                pointerEventCalled = true;
                pointerEventCoords = [ev.x, ev.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testScene.handlePointerEvent(new PointerInputEvent('pointertest', 20, 40), sc);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines a keyboard event handler callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testScene.onKeyboardInput('testkey', (self, ev, sc) => {
                keyboardEventCalled = true;
                keyboardEventType = ev.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testScene.handleKeyboardEvent( new KeyboardInputEvent('testkey', 'testkeytype'), sc);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onResume callback', () => {
            let resumeCalled = false;
            testScene.onResume((self, state) => {
                resumeCalled = true;
            });

            expect(resumeCalled).toBeFalse();

            testScene.resume(sc);

            expect(resumeCalled).toBeTrue();
        });

        it('defines an onStart callback', () => {
            let startCalled = false;
            testScene.onStart((self, state) => {
                startCalled = true;
            });

            expect(startCalled).toBeFalse();

            testScene.start(sc);

            expect(startCalled).toBeTrue();
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testScene.onStep((self, state) => {
                stepCalled = true;
            });

            testScene.step(sc);
            expect(stepCalled).toBeTrue();
        });

        it('defines an onSuspend callback', () => {
            let suspendCalled = false;
            testScene.onSuspend((self, state) => {
                suspendCalled = true;
            });

            expect(suspendCalled).toBeFalse();

            testScene.suspend(sc);

            expect(suspendCalled).toBeTrue();
        });
    });

    describe('step lifecycle', () => {
        let sc: Controller;

        let actorOnCreatedCalled;
        let actorOnGameEventCalled;
        let actorOnGameEventData;
        let actorOnStepCalled;
        let actorOnDestroyCalled; // TODO maybe a mock object for tracking these and use elsewhere

        beforeEach(() => {
            sc = TestUtil.getTestController(testGame);

            actorOnCreatedCalled = false;
            actorOnGameEventCalled = false;
            actorOnGameEventData = null;
            actorOnStepCalled = false;
            actorOnDestroyCalled = false;

            const testActor = testGame.getActor('testActor');
            testActor.onCreate((self, state) => {
                    actorOnCreatedCalled = true;
                });
            testActor.onGameEvent('testEvent', (self, ev, sc) => {
                actorOnGameEventCalled = true;
                actorOnGameEventData = ev.data;
            });
            testActor.onStep((self, state) => {
                actorOnStepCalled = true;
            });
                
            testActor.onDestroy((self, state) => {
                    actorOnDestroyCalled = true;
                });

            testScene.init();
            sc.goToScene('testScene');
            testScene.start(sc);
            //testLayer.activate();
        });

        it('activates new ActorInstances and calls Actor callbacks', () => {
            const instance = testScene.createInstance('testActor');

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.New);
            testScene.step(sc);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(InstanceStatus.Active);
        });

        it('propagates GameEvents to active ActorInstances', () => {
            const instance = testScene.createInstance('testActor');
            instance.activate();

            sc.publishEvent('testEvent', { value: 'testvalue' });
            expect(actorOnGameEventCalled).toBeFalse();
            expect(actorOnGameEventData).toBeNull();

            sc.step();

            expect(actorOnGameEventCalled).toBeTrue();
            expect(actorOnGameEventData.value).toBe('testvalue');
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testScene.createInstance('testActor');
            const mockBehavior = new MockActorInstanceBehavior();
            instance.useBehavior(mockBehavior);
            testScene.step(sc);

            expect(actorOnStepCalled).toBeFalse();
            expect(mockBehavior.beforeStepCallCount).toBe(0);
            expect(mockBehavior.afterStepCallCount).toBe(0);

            testScene.step(sc);

            expect(actorOnStepCalled).toBeTrue();
            expect(mockBehavior.beforeStepCallCount).toBe(1);
            expect(mockBehavior.afterStepCallCount).toBe(1);
        });

        it('deletes destoyed ActorInstances and calls Actor callbacks', () => {
            const instance = testScene.createInstance('testActor');
            instance.destroy();
            expect(actorOnDestroyCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.Destroyed);
            expect(testScene.getInstances().length).toBe(1);

            testScene.step(sc);

            expect(actorOnDestroyCalled).toBeTrue();
            expect(testScene.getInstances().length).toBe(0);
        });
    });
});
