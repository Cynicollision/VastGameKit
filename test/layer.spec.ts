import { ActorInstance, ActorInstanceStatus } from './../engine/actor/instance';
import { RectBoundary } from './../engine/actor/boundaries/rectangleBoundary';
import { Game } from './../engine/game/game';
import { GameController } from './../engine/game/controller';
import { GameEvent } from './../engine/game/gameEvent';
import { KeyboardInputEvent, PointerInputEvent } from './../engine/device/input';
import { Layer, LayerStatus } from '../engine/scene/layer';
import { Scene } from '../engine/scene/scene';
import { TestUtil } from './testUtil';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';

describe('Layer', () => {
    let testGame: Game;
    let testController: GameController;
    let testScene: Scene;
    let testLayer: Layer;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testController = TestUtil.getTestController(testGame);
        testScene = testGame.defineScene('testScene');
        testLayer = testScene.createLayer('testLayer');

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

    it('deletes ActorInstances from its registries', () => {
        const instance: ActorInstance = testScene.defaultLayer.createInstance('testActor', 0, 0);
        let currentCount = testScene.defaultLayer.getInstances().length;
        expect(currentCount).toBe(1);

        testScene.defaultLayer.deleteInstance(instance);

        currentCount = testScene.defaultLayer.getInstances().length;
        expect(currentCount).toBe(0);
    });

    it('checks if a position is free of any ActorInstances', () => {
        const instance: ActorInstance = testScene.defaultLayer.createInstance('testActor', 10, 10);

        expect(testScene.defaultLayer.isPositionFree(0, 0)).toBeTrue()
        expect(testScene.defaultLayer.isPositionFree(20, 20)).toBeFalse();
        expect(testScene.defaultLayer.isPositionFree(31, 31)).toBeTrue();
    });

    it('checks if a position is free of solid ActorInstances', () => {
        const instance: ActorInstance = testScene.defaultLayer.createInstance('testActor', 10, 10);
        instance.actor.solid = true;

        expect(testScene.defaultLayer.isPositionFree(20, 20, true)).toBeFalse();

        instance.actor.solid = false;

        expect(testScene.defaultLayer.isPositionFree(20, 20, true)).toBeTrue();
    });

    it('gets ActorInstances at a position', () => {
        const instance1: ActorInstance = testScene.defaultLayer.createInstance('testActor', 10, 10);
        instance1.actor.solid = true;

        const instance2: ActorInstance = testScene.defaultLayer.createInstance('testActor2', 15, 15);
        instance2.actor.solid = false;

        expect(testScene.defaultLayer.getInstancesAtPosition(5, 5).length).toBe(0);
        expect(testScene.defaultLayer.getInstancesAtPosition(20, 20).length).toBe(2);
        expect(testScene.defaultLayer.getInstancesAtPosition(20, 20, true).length).toBe(1);
    });

    it('gets ActorInstances within a Boundary at a position', () => {
        const instance1: ActorInstance = testScene.defaultLayer.createInstance('testActor', 20, 20);
        instance1.actor.solid = true;

        const instance2: ActorInstance = testScene.defaultLayer.createInstance('testActor2', 25, 25);
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

            testLayer.callGameEvent(testController, new GameEvent('testEvent'));

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines a pointer event handler callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testLayer.onPointerInput('pointertest', (self, state, event) => {
                pointerEventCalled = true;
                pointerEventCoords = [event.x, event.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testLayer.callPointerInput(testController, new PointerInputEvent('pointertest', 20, 40));

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines a keyboard event handler callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testLayer.onKeyboardInput('testkey', (self, state, event) => {
                keyboardEventCalled = true;
                keyboardEventType = event.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testLayer.callKeyboardInput(testController, new KeyboardInputEvent('testkey', 'testkeytype'));

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testLayer.onStep((self, state) => {
                stepCalled = true;
            });

            expect(stepCalled).toBeFalse();

            testLayer.step(testController);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testLayer.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testLayer.draw(testController, testGame.canvas);

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
                .onGameEvent('testEvent', (self, state, event) => {
                    actorOnGameEventCalled = true;
                    actorOnGameEventData = event.data;
                })
                .onStep((self, state) => {
                    actorOnStepCalled = true;
                })
                .onDestroy((self, state) => {
                    actorOnDestroyCalled = true;
                });
        });

        it('activates new ActorInstances and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');

            expect(actorOnCreatedCalled).toBeFalse();
            expect(instance.status).toBe(ActorInstanceStatus.New);
            testLayer.step(testController);

            expect(actorOnCreatedCalled).toBeTrue();
            expect(instance.status).toBe(ActorInstanceStatus.Active);
        });

        it('propagates GameEvents to active ActorInstances', () => {
            const instance = testLayer.createInstance('testActor');
            testLayer.step(testController);

            testController.raiseEvent('testEvent', { value: 'testvalue' });
            expect(actorOnGameEventCalled).toBeFalse();
            expect(actorOnGameEventData).toBeNull();
            testLayer.step(testController);

            expect(actorOnGameEventCalled).toBeTrue();
            expect(actorOnGameEventData.value).toBe('testvalue');
        });

        it('steps active ActorInstances, calls Behaviors, and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');
            const mockBehavior = new MockActorInstanceBehavior();
            instance.useBehavior(mockBehavior);
            testLayer.step(testController);

            expect(actorOnStepCalled).toBeFalse();
            expect(mockBehavior.beforeStepCallCount).toBe(0);
            expect(mockBehavior.afterStepCallCount).toBe(0);

            testLayer.step(testController);

            expect(actorOnStepCalled).toBeTrue();
            expect(mockBehavior.beforeStepCallCount).toBe(1);
            expect(mockBehavior.afterStepCallCount).toBe(1);
        });

        it('deletes destoyed ActorInstances and calls Actor callbacks', () => {
            const instance = testLayer.createInstance('testActor');
            instance.destroy();
            expect(actorOnDestroyCalled).toBeFalse();
            expect(instance.status).toBe(ActorInstanceStatus.Destroyed);
            expect(testLayer.getInstances().length).toBe(1);

            testLayer.step(testController);

            expect(actorOnDestroyCalled).toBeTrue();
            expect(testLayer.getInstances().length).toBe(0);
        });
    });

    describe('draw lifecycle', () => {

        xit('needs tests', () => {
            // TODO
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
