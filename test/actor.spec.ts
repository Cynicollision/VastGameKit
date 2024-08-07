

import { ActorBehaviorName, GameEvent, KeyboardInputEvent, PointerInputEvent } from './../engine/core';
import { ActorDefinition } from './../engine/structure/actor';
import { Game } from './../engine/game';
import { TestImage1 } from './mocks/testImages';
import { TestUtil } from './testUtil';

describe('Actor', () => {
    let testGame: Game;
    let testActor: ActorDefinition;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testActor = <ActorDefinition>testGame.construction.actors.add('testActor');
    });

    it('gets actors who it has collision handlers for', () => {
        testGame.construction.actors.add('collisionActor1');
        testGame.construction.actors.add('collisionActor2');
        testGame.construction.actors.add('otherActor3');

        testActor.onCollision('collisionActor1', () => null);
        expect(testActor.getCollisionActorNames().length).toBe(1);
        testActor.onCollision('collisionActor2', () => null);
        expect(testActor.getCollisionActorNames().length).toBe(2);

        expect(testActor.getCollisionActorNames().indexOf('otherActor3')).toBe(-1);
    });

    it('can use a built-in behavior', () => {
        expect(testActor.behaviors.length).toBe(0);
        testActor.useBehavior(ActorBehaviorName.BasicMotion);
        expect(testActor.behaviors.length).toBe(1);
        expect(testActor.behaviors.indexOf(ActorBehaviorName.BasicMotion)).toBe(0);
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCollision callback', () => {
            let collisionHandlerCalled = false;
            testGame.construction.actors.add('actor2');
            const instance2 = testGame.controller.sceneState.instances.create('actor2');

            testActor.onCollision('actor2', (self, other, state) => {
                collisionHandlerCalled = true;
            });

            expect(collisionHandlerCalled).toBeFalse();

            testActor.callCollision(null, instance2, testGame.controller);
            
            expect(collisionHandlerCalled).toBeTrue();
        });

        it('defines an onCreate callback', () => {
            let createCalled = false;
            testActor.onCreate((self, state) => {
                createCalled = true;
            });

            expect(createCalled).toBeFalse();
            
            testActor.callCreate(null, testGame.controller)

            expect(createCalled).toBeTrue();
        });

        it('defines an onDestroy callback', () => {
            let destroyCalled = false;
            testActor.onDestroy((self, state) => {
                destroyCalled = true;
            });

            expect(destroyCalled).toBeFalse();

            testActor.callDestroy(null, testGame.controller);

            expect(destroyCalled).toBeTrue();
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testActor.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testActor.callDraw(null, testGame.canvas, testGame.controller);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onGameEvent callback', () => {
            let gameEventHandlerCalled = false;
            testActor.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testActor.callGameEvent(null, GameEvent.new('testEvent'), testGame.controller);

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines an onKeyboardInput callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testActor.onKeyboardInput('testkey', (self, event, sc) => {
                keyboardEventCalled = true;
                keyboardEventType = event.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testActor.callKeyboardEvent(null, new KeyboardInputEvent('testkey', 'testkeytype'), testGame.controller);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onPointerInput callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testActor.onPointerInput('pointertest', (self, ev, sc) => {
                pointerEventCalled = true;
                pointerEventCoords = [ev.x, ev.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testActor.callPointerEvent(null, new PointerInputEvent('pointertest', 20, 40), testGame.controller);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testActor.onStep((self, state) => {
                stepCalled = true;
            });

            expect(stepCalled).toBeFalse();

            testActor.callStep(null, testGame.controller);

            expect(stepCalled).toBeTrue();
        });
    });

    describe('sets its boundary', () => {

        it('as a circle with the given radius', () => {
            expect(testActor.boundary).toBeUndefined();

            const radius = 8;
            testActor.setCircleBoundary(radius, -8, -8);

            expect(testActor.boundary.height).toBe(radius * 2);
            expect(testActor.boundary.atPosition(32, 32).containsPosition(22, 22)).toBeFalse();
            expect(testActor.boundary.atPosition(32, 32).containsPosition(28, 28)).toBeTrue();
            expect(testActor.boundary.atPosition(32, 32).containsPosition(36, 36)).toBeTrue();
            expect(testActor.boundary.atPosition(32, 32).containsPosition(42, 42)).toBeFalse();
        });

        it('as a circle the size of its Sprite', done => {
            expect(testActor.boundary).toBeUndefined();
    
            testActor.sprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source, height: TestImage1.Height, width: TestImage1.Height });
            testActor.sprite.loadImage().then(() => {
                const boundary = testActor.setCircleBoundaryFromSprite();
    
                expect(testActor.boundary).toBe(boundary);
                expect(boundary.radius).toBe(TestImage1.Height / 2);
                expect(boundary.height).toBe(TestImage1.Height);
                expect(boundary.width).toBe(TestImage1.Height);
    
                done();
            });
        });

        it('as a rectangle with the given dimensions', () => {
            expect(testActor.boundary).toBeUndefined();

            const width = 20;
            const height = 10;
            testActor.setRectBoundary(width, height, 0, 0);
            expect(testActor.boundary.width).toBe(width);
            expect(testActor.boundary.width).toBe(width);
        });

        it('as a rectangle the size of its Sprite', done => {
            expect(testActor.boundary).toBeUndefined();
    
            testActor.sprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source });
            testActor.sprite.loadImage().then(() => {
                const boundary = testActor.setRectBoundaryFromSprite();
    
                expect(testActor.boundary).toBe(boundary);
                expect(boundary.height).toBe(TestImage1.Height);
                expect(boundary.width).toBe(TestImage1.Width);
    
                done();
            });
        });
    });
});
