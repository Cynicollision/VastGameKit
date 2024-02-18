
import { Actor } from './../engine/actor';
import { Game, GameEvent, GameState } from './../engine/game';
import { KeyboardInputEvent, PointerInputEvent } from './../engine/device';
import { Room } from './../engine/room';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Actor', () => {
    let testGame: Game;
    let testState: GameState;
    let testActor: Actor;
    let testRoom: Room;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testState = TestUtil.getTestState(testGame);
        testActor = testGame.defineActor('testActor');
        testRoom = testGame.defineRoom('testRoom');
    });

    it('defines an on-load callback', () => {
        let loadCalled = false;
        let loadedActor = null;
        testActor.onLoad(actor => {
            loadCalled = true;
            loadedActor = actor;
        });

        expect(loadCalled).toBeFalse();

        testActor.load();

        expect(loadCalled).toBeTrue();
        expect(loadedActor).toBe(testActor);
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCreate callback', () => {
            let createCalled = false;
            testActor.onCreate((self, state) => {
                createCalled = true;
            });

            expect(createCalled).toBeFalse();
            
            testActor.callCreate(null, testState)

            expect(createCalled).toBeTrue();
        });

        it('defines a collsion handler callback', () => {
            let collisionHandlerCalled = false;
            testGame.defineActor('actor2');
            const instance2 = testRoom.defaultLayer.createInstance('actor2');

            testActor.onCollision('actor2', (self, other, state) => {
                collisionHandlerCalled = true;
            });

            expect(collisionHandlerCalled).toBeFalse();

            testActor.callCollision(null, instance2, testState);
            
            expect(collisionHandlerCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testActor.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testActor.callGameEvent(null, testState, new GameEvent('testEvent'));

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines a pointer event handler callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testActor.onPointerInput('pointertest', (self, state, event) => {
                pointerEventCalled = true;
                pointerEventCoords = [event.x, event.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testActor.callPointerInput(null, testState, new PointerInputEvent('pointertest', 20, 40));

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines a keyboard event handler callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testActor.onKeyboardInput('testkey', (self, state, event) => {
                keyboardEventCalled = true;
                keyboardEventType = event.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testActor.callKeyboardInput(null, testState, new KeyboardInputEvent('testkey', 'testkeytype'));

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testActor.onStep((self, state) => {
                stepCalled = true;
            });

            expect(stepCalled).toBeFalse();

            testActor.callStep(null, testState);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testActor.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testActor.callDraw(null, testState, testGame.canvas);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onDestroy callback', () => {
            let destroyCalled = false;
            testActor.onDestroy((self, state) => {
                destroyCalled = true;
            });

            expect(destroyCalled).toBeFalse();

            testActor.callDestroy(null, testState);

            expect(destroyCalled).toBeTrue();
        });
    });

    it('sets its boundary to the size of its Sprite', (done) => {
        expect(testActor.boundary).toBeUndefined();

        testActor.sprite = testGame.defineSprite('testSprite', TestImage.Source);
        testActor.sprite.load().then(() => {
            const boundary = testActor.setRectBoundaryFromSprite();

            expect(testActor.boundary).toBe(boundary);
            expect(boundary.height).toBe(TestImage.Height);
            expect(boundary.width).toBe(TestImage.Width);

            done();
        });
    });

    it('handles raised game events it subscribes to', () => {
        let handlerCalled = false;
        let dataFromEvent = null;

        testActor.onGameEvent('testEvent', (self, state, event) => {
            handlerCalled = true;
            dataFromEvent = event.data.value;
        });

        expect(handlerCalled).toBeFalse();
        expect(dataFromEvent).toBeNull();

        const event = new GameEvent('testEvent', { value: 123 });
        testActor.callGameEvent(null, TestUtil.getTestState(testGame), event);

        expect(handlerCalled).toBeTrue();
        expect(dataFromEvent).toBe(123);
    });
});
