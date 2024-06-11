import { GameEvent, InstanceStatus, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    const TestSceneHeight = 600;
    const TestSceneWidth = 800;

    let testGame: Game;
    let testScene: GameScene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testScene = <GameScene>testGame.resources.defineScene('scnTest', { width: TestSceneWidth, height: TestSceneHeight });
    });

    it('initializes with a default Camera', () => {
        expect(testScene.defaultCamera).toBeDefined();
        expect(testScene.defaultCamera.name).toBe(GameScene.DefaultCameraName);
        expect(testScene.defaultCamera.height).toBe(TestSceneHeight);
        expect(testScene.defaultCamera.width).toBe(TestSceneWidth);
    });

    it('defines an onLoad callback', () => {
        let loadEventCalled = false;
        testScene.onLoad(actor => {
            loadEventCalled = true;
        });

        expect(loadEventCalled).toBeFalse();

        testScene.load();

        expect(loadEventCalled).toBeTrue();
    });

    xit('propgates KeyboardEvents to Embeds and Instances', () => {

    });

    xit('propgates GameEvents to Embeds and Instances', () => {

    });

    xit('propgates PointerEvents to Embeds and Instances', () => {

    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);
        });

        it('when Starting, on scene start, changes to Running', () => {
            testScene.startOrResume(testGame.controller);

            expect(testScene.status).toBe(SceneStatus.Running);
        });

        it('when Running, on scene suspend, changes to Suspended', () => {
            testScene.suspend(testGame.controller);

            expect(testScene.status).toBe(SceneStatus.Suspended);
        });

        it('when Resuming, on scene start, changes to Running', () => {
            testScene.options.persistent = true;
            testScene.suspend(testGame.controller);

            expect(testScene.status).toBe(SceneStatus.Suspended);

            testScene.startOrResume(testGame.controller);

            expect(testScene.status).toBe(SceneStatus.Running);
        });
    });

    describe('lifecycle callbacks', () => {

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testScene.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testScene.draw(testGame.canvas, testGame.controller);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onGameEvent callback', () => {
            let gameEventHandlerCalled = false;
            testScene.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testScene.handleGameEvent(GameEvent.new('testEvent'), testGame.controller);

            expect(gameEventHandlerCalled).toBeTrue();
        });

        it('defines an onKeyboardInput callback', () => {
            let keyboardEventCalled = false;
            let keyboardEventType = null;
            testScene.onKeyboardInput('testkey', (self, ev, sc) => {
                keyboardEventCalled = true;
                keyboardEventType = ev.type;
            });

            expect(keyboardEventCalled).toBeFalse();

            testScene.handleKeyboardEvent( new KeyboardInputEvent('testkey', 'testkeytype'), testGame.controller);

            expect(keyboardEventCalled).toBeTrue();
            expect(keyboardEventType).toBe('testkeytype');
        });

        it('defines an onPointerInput callback', () => {
            let pointerEventCalled = false;
            let pointerEventCoords = null;
            testScene.onPointerInput('pointertest', (self, ev, sc) => {
                pointerEventCalled = true;
                pointerEventCoords = [ev.x, ev.y];
            });

            expect(pointerEventCalled).toBeFalse();

            testScene.handlePointerEvent(new PointerInputEvent('pointertest', 20, 40), testGame.controller);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines an onResume callback', () => {
            let resumeCalled = false;
            testScene.onResume((self, state) => {
                resumeCalled = true;
            });

            expect(resumeCalled).toBeFalse();

            testScene.startOrResume(testGame.controller);
            testScene.suspend(testGame.controller);
            testScene.startOrResume(testGame.controller);

            expect(resumeCalled).toBeTrue();
        });

        it('defines an onStart callback', () => {
            let startCalled = false;
            testScene.onStart((self, state) => {
                startCalled = true;
            });

            expect(startCalled).toBeFalse();

            testScene.startOrResume(testGame.controller);

            expect(startCalled).toBeTrue();
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testScene.onStep((self, state) => {
                stepCalled = true;
            });

            testScene.startOrResume(testGame.controller);
            testScene.step(testGame.controller);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onSuspend callback', () => {
            let suspendCalled = false;
            testScene.onSuspend((self, state) => {
                suspendCalled = true;
            });

            expect(suspendCalled).toBeFalse();

            testScene.suspend(testGame.controller);

            expect(suspendCalled).toBeTrue();
        });
    });
});
