import { ActorInstance } from './../engine/actor';
import { Game, GameEvent, GameState } from './../engine/game';
import { KeyboardInputEvent, PointerInputEvent } from '../engine/device';
import { Layer, LayerStatus , Room } from './../engine/room';
import { TestUtil } from './testUtil';

describe('Layer', () => {
    let testGame: Game;
    let testState: GameState;
    let testRoom: Room;
    let testLayer: Layer;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testState = TestUtil.getTestState(testGame);
        testRoom = testGame.defineRoom('testRoom');
        testLayer = testRoom.createLayer('testLayer');

        testGame.defineActor('testActor');
    });

    it('defines the default layer', () => {
        expect(testRoom.defaultLayer).not.toBeNull();
    });

    it('creates ActorInstances', () => {
        testRoom.defaultLayer.createInstance('testActor', 0, 0);
        const layerInstances = testRoom.defaultLayer.getActorInstances();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('deletes ActorInstances from its registries', () => {
        const instance: ActorInstance = testRoom.defaultLayer.createInstance('testActor', 0, 0);
        let currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(1);

        testRoom.defaultLayer.deleteInstance(instance);

        currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(0);
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCreate callback', () => {
            let createCalled = false;
            testLayer.onCreate((self, state) => {
                createCalled = true;
            });

            expect(createCalled).toBeFalse();

            testLayer.callCreate(testState);

            expect(createCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testLayer.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testLayer.callGameEvent(testState, new GameEvent('testEvent'));

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

            testLayer.callPointerInput(testState, new PointerInputEvent('pointertest', 20, 40));

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

            testLayer.callKeyboardInput(testState, new KeyboardInputEvent('testkey', 'testkeytype'));

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testLayer.onStep((self, state) => {
                stepCalled = true;
            });

            expect(stepCalled).toBeFalse();

            testLayer.step(testState);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testLayer.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testLayer.draw(testState, testGame.canvas);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onDestroy callback', () => {
            let destroyCalled = false;
            testLayer.onDestroy((self, state) => {
                destroyCalled = true;
            });

            expect(destroyCalled).toBeFalse();

            testLayer.callDestroy(testState);

            expect(destroyCalled).toBeTrue();
        });
    });

    describe('step lifecycle', () => {
        it('NEEDS TESTS', () => {
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
