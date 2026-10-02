import { GameEvent, InstanceStatus, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { GameScene } from './../engine/structure/scene';
import { SceneState } from './../engine/state/sceneState';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    const TestSceneName = 'scnTest';
    const TestSceneHeight = 600;
    const TestSceneWidth = 800;

    let testGame: Game;
    let testScene: GameScene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testScene = <GameScene>testGame.construction.scenes.add(TestSceneName, { width: TestSceneWidth, height: TestSceneHeight });
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
            let keyboardEventType = null as string | null;
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
            let pointerEventCoords = null as number[] | null;
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

    describe('placeActor', () => {
        beforeEach(() => {
            testGame.construction.actors.add('actWall').setRectBoundary(16, 16);
            testGame.construction.actors.add('actCoin').setRectBoundary(8, 8);
        });

        it('creates placed Instances in a new SceneState, before onStart', () => {
            let actorsAtStart: string[] = [];
            testScene.placeActor('actWall', { x: 16, y: 32, depth: 5 });
            testScene.placeActor('actCoin');
            testScene.onStart(self => actorsAtStart = self.instances.getAll().map(instance => instance.actor.name));

            const sceneState = testGame.controller.getSceneState(TestSceneName);
            sceneState.startOrResume(testGame.controller);

            const [wall, coin] = sceneState.instances.getAll();
            expect(actorsAtStart).toEqual(['actWall', 'actCoin']);
            expect([wall.x, wall.y, wall.depth]).toEqual([16, 32, 5]);
            expect([coin.x, coin.y, coin.depth]).toEqual([0, 0, 0]);
        });

        it('creates placed Instances again each time a Scene that isn\'t persistent starts over', () => {
            testScene.placeActor('actWall', { x: 16, y: 32 });

            const first = testGame.controller.getSceneState(TestSceneName);
            first.instances.getAll()[0].x = 100;
            const second = testGame.controller.getSceneState(TestSceneName);

            expect(second).not.toBe(first);
            expect(second.instances.getAll().length).toBe(1);
            expect(second.instances.getAll()[0].x).toBe(16);
        });

        it('creates placed Instances once for a persistent Scene', () => {
            const persistentScene = testGame.construction.scenes.add('scnPersistent', { persistent: true });
            persistentScene.placeActor('actWall');

            const first = testGame.controller.getSceneState('scnPersistent');
            const second = testGame.controller.getSceneState('scnPersistent');

            expect(second).toBe(first);
            expect(second.instances.getAll().length).toBe(1);
        });
    });
});
