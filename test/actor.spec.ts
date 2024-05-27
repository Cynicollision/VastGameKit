

import { Actor } from './../engine/actor/actor';
import { GameEvent } from './../engine/core/event';
import { KeyboardInputEvent } from './../engine/device/keyboard';
import { PointerInputEvent } from './../engine/device/pointer';
import { Game } from './../engine/game';
import { Controller } from './../engine/scene/controller';
import { Scene } from './../engine/scene/scene';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Actor', () => {
    let testGame: Game;
    let testController: Controller;
    let testActor: Actor;
    let testScene: Scene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testController = TestUtil.getTestController(testGame);
        testActor = <Actor>testGame.defineActor('testActor');
        testScene = <Scene>testGame.defineScene('testScene');
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
            
            testActor.callCreate(null, testController)

            expect(createCalled).toBeTrue();
        });

        it('defines a collsion handler callback', () => {
            let collisionHandlerCalled = false;
            testGame.defineActor('actor2');
            const instance2 = testScene.createInstance('actor2');

            testActor.onCollision('actor2', (self, other, state) => {
                collisionHandlerCalled = true;
            });

            expect(collisionHandlerCalled).toBeFalse();

            testActor.callCollision(null, instance2, testController);
            
            expect(collisionHandlerCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testActor.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testActor.callGameEvent(null, GameEvent.init('testEvent'), testController);

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines a pointer event handler callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testActor.onPointerInput('pointertest', (self, ev, sc) => {
                pointerEventCalled = true;
                pointerEventCoords = [ev.x, ev.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testActor.callPointerInput(null, new PointerInputEvent('pointertest', 20, 40), testController);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines a keyboard event handler callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testActor.onKeyboardInput('testkey', (self, event, sc) => {
                keyboardEventCalled = true;
                keyboardEventType = event.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testActor.callKeyboardInput(null, new KeyboardInputEvent('testkey', 'testkeytype'), testController);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testActor.onStep((self, state) => {
                stepCalled = true;
            });

            expect(stepCalled).toBeFalse();

            testActor.callStep(null, testController);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testActor.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testActor.callDraw(null, testGame.canvas, testController);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onDestroy callback', () => {
            let destroyCalled = false;
            testActor.onDestroy((self, state) => {
                destroyCalled = true;
            });

            expect(destroyCalled).toBeFalse();

            testActor.callDestroy(null, testController);

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

        testActor.onGameEvent('testEvent', (self, ev, sc) => {
            handlerCalled = true;
            dataFromEvent = event.data.value;
        });

        expect(handlerCalled).toBeFalse();
        expect(dataFromEvent).toBeNull();

        const event = GameEvent.init('testEvent', { value: 123 });
        testActor.callGameEvent(null, event, testController);

        expect(handlerCalled).toBeTrue();
        expect(dataFromEvent).toBe(123);
    });
});
