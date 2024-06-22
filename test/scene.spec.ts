import { SceneState } from './../engine/scene/sceneState';
import { GameEvent, InstanceStatus, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { MockActorInstanceBehavior } from './mocks/mockActorInstanceBehavior';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    const TestSceneName = 'scnTest';
    const TestSceneHeight = 600;
    const TestSceneWidth = 800;

    let testGame: Game;
    let testScene: GameScene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testScene = <GameScene>testGame.construct.defineScene(TestSceneName, { width: TestSceneWidth, height: TestSceneHeight });
    });

    describe('lifecycle callbacks', () => {
        let testSceneState: SceneState;

        beforeEach(() => {
            testSceneState = testGame.controller.getSceneState(TestSceneName);
        });

        it('defines an onDraw callback', () => {
            let drawCalled = false;
            testScene.onDraw((self, state) => {
                drawCalled = true;
            });

            expect(drawCalled).toBeFalse();

            testSceneState.draw(testGame.canvas, testGame.controller);

            expect(drawCalled).toBeTrue();
        });

        it('defines an onGameEvent callback', () => {
            let gameEventHandlerCalled = false;
            testScene.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testSceneState.handleGameEvent(GameEvent.new('testEvent'), testGame.controller);

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

            testSceneState.handleKeyboardEvent( new KeyboardInputEvent('testkey', 'testkeytype'), testGame.controller);

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

            testSceneState.handlePointerEvent(new PointerInputEvent('pointertest', 20, 40), testGame.controller);

            expect(pointerEventCalled).toBeTrue();
            expect(pointerEventCoords).toEqual([20, 40]);
        });

        it('defines an onResume callback', () => {
            let resumeCalled = false;
            testScene.onResume((self, state) => {
                resumeCalled = true;
            });

            expect(resumeCalled).toBeFalse();

            testSceneState.startOrResume(testGame.controller);
            testSceneState.suspend(testGame.controller);
            testSceneState.startOrResume(testGame.controller);

            expect(resumeCalled).toBeTrue();
        });

        it('defines an onStart callback', () => {
            let startCalled = false;
            testScene.onStart((self, state) => {
                startCalled = true;
            });

            expect(startCalled).toBeFalse();

            testSceneState.startOrResume(testGame.controller);

            expect(startCalled).toBeTrue();
        });

        it('defines an onStep callback', () => {
            let stepCalled = false;
            testScene.onStep((self, state) => {
                stepCalled = true;
            });

            testSceneState.startOrResume(testGame.controller);
            testSceneState.step(testGame.controller);

            expect(stepCalled).toBeTrue();
        });

        it('defines an onSuspend callback', () => {
            let suspendCalled = false;
            testScene.onSuspend((self, state) => {
                suspendCalled = true;
            });

            expect(suspendCalled).toBeFalse();

            testSceneState.suspend(testGame.controller);

            expect(suspendCalled).toBeTrue();
        });
    });
});
