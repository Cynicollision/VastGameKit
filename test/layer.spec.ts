import { RectBoundary } from './../engine/actor/boundaries/rectangleBoundary';
import { InstanceStatus, LayerStatus } from './../engine/core/enum';
import { GameEvent } from './../engine/core/event';
import { KeyboardInputEvent } from './../engine/device/keyboard';
import { PointerInputEvent } from './../engine/device/pointer';
import { Game } from './../engine/game';
import { Controller } from './../engine/scene/controller';
import { Layer,  } from './../engine/scene/layer';
import { Scene } from './../engine/scene/scene';
import { TestUtil } from './testUtil';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';

describe('Layer', () => {
    let testGame: Game;
    let testController: Controller;
    let testScene: Scene;
    let testLayer: Layer;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testController = TestUtil.getTestController(testGame);
        testScene = testGame.defineScene('testScene');
        testLayer = <Layer>testScene.defineLayer('testLayer');

        testGame.defineActor('testActor').setRectBoundary(20, 20);
        testGame.defineActor('testActor2').setRectBoundary(20, 20);
    });

    it('defines the default layer', () => {
        expect(testScene.defaultLayer).not.toBeNull();
    });

    it('creates ActorInstances', () => {
        testScene.defaultLayer.createInstance('testActor', 0, 0);
        const layerInstances = testScene.defaultLayer.getInstances();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('checks if a position is free of any ActorInstances', () => {
        const instance = testScene.defaultLayer.createInstance('testActor', 10, 10);

        expect(testScene.defaultLayer.isPositionFree(0, 0)).toBeTrue()
        expect(testScene.defaultLayer.isPositionFree(20, 20)).toBeFalse();
        expect(testScene.defaultLayer.isPositionFree(31, 31)).toBeTrue();
    });

    it('checks if a position is free of solid ActorInstances', () => {
        const instance = testScene.defaultLayer.createInstance('testActor', 10, 10);
        instance.actor.solid = true;

        expect(testScene.defaultLayer.isPositionFree(20, 20, true)).toBeFalse();

        instance.actor.solid = false;

        expect(testScene.defaultLayer.isPositionFree(20, 20, true)).toBeTrue();
    });

    it('gets ActorInstances at a position', () => {
        const instance1 = testScene.defaultLayer.createInstance('testActor', 10, 10);
        instance1.actor.solid = true;

        const instance2 = testScene.defaultLayer.createInstance('testActor2', 15, 15);
        instance2.actor.solid = false;

        expect(testScene.defaultLayer.getInstancesAtPosition(5, 5).length).toBe(0);
        expect(testScene.defaultLayer.getInstancesAtPosition(20, 20).length).toBe(2);
        expect(testScene.defaultLayer.getInstancesAtPosition(20, 20, true).length).toBe(1);
    });

    it('gets ActorInstances within a Boundary at a position', () => {
        const instance1 = testScene.defaultLayer.createInstance('testActor', 20, 20);
        instance1.actor.solid = true;

        const instance2 = testScene.defaultLayer.createInstance('testActor2', 25, 25);
        instance2.actor.solid = false;

        const boundary = new RectBoundary(8, 8);

        expect(testScene.defaultLayer.getInstancesWithinBoundaryAtPosition(boundary, 4, 4).length).toBe(0);
        expect(testScene.defaultLayer.getInstancesWithinBoundaryAtPosition(boundary, 16, 16).length).toBe(1);
        expect(testScene.defaultLayer.getInstancesWithinBoundaryAtPosition(boundary, 19, 19).length).toBe(2);
        expect(testScene.defaultLayer.getInstancesWithinBoundaryAtPosition(boundary, 19, 19, true).length).toBe(1);
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCreate callback', () => {
            let createCalled = false;
            testLayer.onCreate((self, state) => {
                createCalled = true;
            });

            expect(createCalled).toBeFalse();

            testLayer.callCreate(testController);

            expect(createCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testLayer.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testLayer.callGameEvent(GameEvent.raise('testEvent'), testController);

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines a pointer event handler callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testLayer.onPointerInput('pointertest', (self, ev, sc) => {
                pointerEventCalled = true;
                pointerEventCoords = [ev.x, ev.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testLayer.callPointerInput(new PointerInputEvent('pointertest', 20, 40), testController);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines a keyboard event handler callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testLayer.onKeyboardInput('testkey', (self, ev, sc) => {
                keyboardEventCalled = true;
                keyboardEventType = ev.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testLayer.callKeyboardInput(new KeyboardInputEvent('testkey', 'testkeytype'), testController);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testLayer.onStep((self, state) => {
                stepCalled = true;
            });

            testLayer.activate();
            expect(stepCalled).toBeFalse();

            testLayer.step([], testController);
            expect(stepCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testLayer.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testLayer.draw(testGame.canvas, testController);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onDestroy callback', () => {
            let destroyCalled = false;
            testLayer.onDestroy((self, state) => {
                destroyCalled = true;
            });

            expect(destroyCalled).toBeFalse();

            testLayer.callDestroy(testController);

            expect(destroyCalled).toBeTrue();
        });
    });

    describe('step lifecycle', () => {
        let actorOnCreatedCalled;
        let actorOnGameEventCalled;
        let actorOnGameEventData;
        let actorOnStepCalled;
        let actorOnDestroyCalled; // TODO maybe a mock object for tracking these and use elsewhere

        beforeEach(() => {
            actorOnCreatedCalled = false;
            actorOnGameEventCalled = false;
            actorOnGameEventData = null;
            actorOnStepCalled = false;
            actorOnDestroyCalled = false;

            testGame.getActor('testActor')
                .onCreate((self, state) => {
                    actorOnCreatedCalled = true;
                })
                .onGameEvent('testEvent', (self, ev, sc) => {
                    actorOnGameEventCalled = true;
                    actorOnGameEventData = ev.data;
                })
                .onStep((self, state) => {
                    actorOnStepCalled = true;
                })
                .onDestroy((self, state) => {
                    actorOnDestroyCalled = true;
                });

            testScene.init();
            testController.goToScene('testScene');
            testScene.start(testController);
            testLayer.activate();
        });

        it('activates new ActorInstances and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.New);
            testLayer.step([], testController);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(InstanceStatus.Active);
        });

        it('propagates GameEvents to active ActorInstances', () => {
            const instance = testLayer.createInstance('testActor');
            instance.activate();

            testController.raiseEvent('testEvent', { value: 'testvalue' });
            expect(actorOnGameEventCalled).toBeFalse();
            expect(actorOnGameEventData).toBeNull();

            testController.step();

            expect(actorOnGameEventCalled).toBeTrue();
            expect(actorOnGameEventData.value).toBe('testvalue');
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');
            const mockBehavior = new MockActorInstanceBehavior();
            instance.useBehavior(mockBehavior);
            testLayer.step([], testController);

            expect(actorOnStepCalled).toBeFalse();
            expect(mockBehavior.beforeStepCallCount).toBe(0);
            expect(mockBehavior.afterStepCallCount).toBe(0);

            testLayer.step([], testController);

            expect(actorOnStepCalled).toBeTrue();
            expect(mockBehavior.beforeStepCallCount).toBe(1);
            expect(mockBehavior.afterStepCallCount).toBe(1);
        });

        it('deletes destoyed ActorInstances and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');
            instance.destroy();
            expect(actorOnDestroyCalled).toBeFalse();
            expect(instance.status).toBe(InstanceStatus.Destroyed);
            expect(testLayer.getInstances().length).toBe(1);

            testLayer.step([], testController);

            expect(actorOnDestroyCalled).toBeTrue();
            expect(testLayer.getInstances().length).toBe(0);
        });
    });

    describe('status', () => {
        
        it('begins as New', () => {
            expect(testLayer.status).toBe(LayerStatus.New);
        });

        it('when activated, changes to Active', () => {
            testLayer.activate();
            expect(testLayer.status).toBe(LayerStatus.Active);
        });

        it('when inactivated, changes to Inactive', () => {
            expect(testLayer.status).toBe(InstanceStatus.New);

            testLayer.inactivate();

            expect(testLayer.status).toBe(InstanceStatus.Inactive);
        });

        it('when destroyed, changes to Destroyed', () => {
            testLayer.destroy();
            expect(testLayer.status).toBe(LayerStatus.Destroyed);
        });

        it('when initialized, changes to New', () => {
            testLayer.activate();
            expect(testLayer.status).toBe(LayerStatus.Active);

            testLayer.init();
            
            expect(testLayer.status).toBe(LayerStatus.New);
        });
    });
});
