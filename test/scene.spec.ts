import { RectBoundary } from './../engine/core/boundaries/rectangleBoundary';
import { GameEvent, InstanceStatus, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { Game } from './../engine/game';
import { Controller } from './../engine/controller';
import { Scene } from './../engine/scene';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    let testGame: Game;
    let testController: Controller;
    let testScene: Scene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testController = TestUtil.getTestController(testGame);
        testScene = <Scene>testGame.resources.defineScene('testScene');
    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);
        });

        it('when Starting, on scene start, changes to Running', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.startOrResume(sc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });

        it('when Running, on scene suspend, changes to Suspended', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.suspend(sc);

            expect(testScene.status).toBe(SceneStatus.Suspended);
        });

        it('when Resuming, on scene start, changes to Running', () => {
            const sc = TestUtil.getTestController(testGame);
            testScene.options.persistent = true;
            testScene.suspend(sc);

            expect(testScene.status).toBe(SceneStatus.Suspended);

            testScene.startOrResume(sc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });
    });

    describe('lifecycle callbacks', () => {
        let testController: Controller;

        beforeEach(() => {
            testController = TestUtil.getTestController(testGame);
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testScene.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testScene.draw(testGame.canvas, testController);

            expect(drawCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testScene.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testScene.handleGameEvent(GameEvent.new('testEvent'), testController);

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

            testScene.handlePointerEvent(new PointerInputEvent('pointertest', 20, 40), testController);

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

            testScene.handleKeyboardEvent( new KeyboardInputEvent('testkey', 'testkeytype'), testController);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onResume callback', () => {
            let resumeCalled = false;
            testScene.onResume((self, state) => {
                resumeCalled = true;
            });

            expect(resumeCalled).toBeFalse();

            testScene.startOrResume(testController);
            testScene.suspend(testController);
            testScene.startOrResume(testController);

            expect(resumeCalled).toBeTrue();
        });

        it('defines an onStart callback', () => {
            let startCalled = false;
            testScene.onStart((self, state) => {
                startCalled = true;
            });

            expect(startCalled).toBeFalse();

            testScene.startOrResume(testController);

            expect(startCalled).toBeTrue();
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testScene.onStep((self, state) => {
                stepCalled = true;
            });

            testScene.startOrResume(testController);
            testScene.step(testController);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onSuspend callback', () => {
            let suspendCalled = false;
            testScene.onSuspend((self, state) => {
                suspendCalled = true;
            });

            expect(suspendCalled).toBeFalse();

            testScene.suspend(testController);

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

            const testActor = testGame.resources.defineActor('testActor');
            testActor.setRectBoundary(20, 20);

            //const testActor = testGame.resources.getActor('testActor');
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

            sc.goToScene('testScene');
            testScene.startOrResume(sc);
        });

        it('activates new ActorInstances and calls Actor callbacks', () => {
            const instance = testScene.instances.create('testActor');

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.New);
            testScene.step(sc);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(InstanceStatus.Active);
        });

        it('propagates GameEvents to active ActorInstances', () => {
            const instance = testScene.instances.create('testActor');
            instance.activate();

            sc.publishEvent('testEvent', { value: 'testvalue' });
            expect(actorOnGameEventCalled).toBeFalse();
            expect(actorOnGameEventData).toBeNull();

            sc.step();

            expect(actorOnGameEventCalled).toBeTrue();
            expect(actorOnGameEventData.value).toBe('testvalue');
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testScene.instances.create('testActor');
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
            const instance = testScene.instances.create('testActor');
            instance.destroy();
            expect(actorOnDestroyCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.Destroyed);
            expect(testScene.instances.getAll().length).toBe(1);

            testScene.step(sc);

            expect(actorOnDestroyCalled).toBeTrue();
            expect(testScene.instances.getAll().length).toBe(0);
        });
    });
});
