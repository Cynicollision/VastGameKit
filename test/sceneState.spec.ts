import { GameEvent, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { Instance } from './../engine/state/instance';
import { SceneState } from './../engine/state/sceneState';
import { SubScene } from './../engine/state/subScene';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('SceneState', () => {
    const TestActorName = 'actTest';
    const TestEmbedSubSceneName = 'scnEmbed';
    const TestSceneName = 'scnTest';
    const TestSceneHeight = 600;
    const TestSceneWidth = 800;
    
    let testGame: Game;
    let testSceneState: SceneState;
    let testInstance: Instance;
    let testEmbeddedSubScene: SubScene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construction.scenes.add(TestSceneName, { width: TestSceneWidth, height: TestSceneHeight, persistent: false });

        testGame.construction.actors.add(TestActorName);
        testGame.construction.scenes.add(TestEmbedSubSceneName, { height: 100, width: 100 });

        testSceneState = testGame.controller.getSceneState(TestSceneName);
        testInstance = testSceneState.instances.create(TestActorName);
        testGame.construction.actors.get(TestActorName).setRectBoundary(10, 10);

        testEmbeddedSubScene = testSceneState.embedSubScene(TestEmbedSubSceneName, { x: 50, y: 50 });
    });

    it('initializes with a default Camera', () => {
        expect(testSceneState.defaultCamera).toBeDefined();
        expect(testSceneState.defaultCamera.name).toBe(SceneState.DefaultCameraName);
        expect(testSceneState.defaultCamera.height).toBe(TestSceneHeight);
        expect(testSceneState.defaultCamera.width).toBe(TestSceneWidth);
    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testSceneState.status).toBe(SceneStatus.NotStarted);
        });

        it('when Starting, on scene start, changes to Running', () => {
            testSceneState.startOrResume(testGame.controller);

            expect(testSceneState.status).toBe(SceneStatus.Running);
        });

        it('when Running, on scene suspend, changes to Suspended', () => {
            testSceneState.suspend(testGame.controller);

            expect(testSceneState.status).toBe(SceneStatus.Suspended);
        });

        it('when Resuming, on scene start, changes to Running', () => {
            testSceneState.suspend(testGame.controller);

            expect(testSceneState.status).toBe(SceneStatus.Suspended);

            testSceneState.startOrResume(testGame.controller);

            expect(testSceneState.status).toBe(SceneStatus.Running);
        });
    });

    it('starts embedded SceneStates upon creating them', () => {
        let embedOnStartCalled = false;
        testGame.construction.scenes.get(TestEmbedSubSceneName).onStart((self, event, controller) => {
            embedOnStartCalled = true;
        });

        testSceneState.embedSubScene('scnEmbed');
        expect(embedOnStartCalled).toBeTrue();
    });

    it('propgates KeyboardEvents to SubScenes and Instances', () => {
        let actorEventHandlerCalled = false;
        testGame.construction.actors.get(TestActorName).onKeyboardInput('testKey', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let sceneEventHandlerCalled = false;
        testGame.construction.scenes.get(TestEmbedSubSceneName).onKeyboardInput('testKey', (self, event, controller) => {
            sceneEventHandlerCalled = true;
        });

        expect(actorEventHandlerCalled).toBeFalse();
        expect(sceneEventHandlerCalled).toBeFalse();

        const kbEvent = new KeyboardInputEvent('testKey', 'testkeytype');
        testSceneState.handleKeyboardEvent(kbEvent, testGame.controller);

        expect(actorEventHandlerCalled).toBeTrue();
        expect(sceneEventHandlerCalled).toBeTrue();
    });

    it('propgates GameEvents to SubScenes and Instances', () => {

        let actorEventHandlerCalled = false;
        testGame.construction.actors.get(TestActorName).onGameEvent('testEvent', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let sceneEventHandlerCalled = false;
        testGame.construction.scenes.get(TestEmbedSubSceneName).onGameEvent('testEvent', (self, event, controller) => {
            sceneEventHandlerCalled = true;
        });

        expect(actorEventHandlerCalled).toBeFalse();
        expect(sceneEventHandlerCalled).toBeFalse();

        const testEventData = { foo: 'bar' };
        const testEvent = GameEvent.new('testEvent', testEventData);
        testSceneState.handleGameEvent(testEvent, testGame.controller);

        expect(actorEventHandlerCalled).toBeTrue();
        expect(sceneEventHandlerCalled).toBeTrue();
    });

    it('propgates PointerEvents to embedded SubScenes and Instances', () => {
        let actorEventHandlerCalled = false;
        testGame.construction.actors.get(TestActorName).onPointerInput('testPointer', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let embeddedSceneEventHandlerCalled = false;
        testGame.construction.scenes.get(TestEmbedSubSceneName).onPointerInput('testPointer', (self, event, controller) => {
            embeddedSceneEventHandlerCalled = true;
        });

        expect(actorEventHandlerCalled).toBeFalse();
        expect(embeddedSceneEventHandlerCalled).toBeFalse();

        const pointerEvent = new PointerInputEvent('testPointer', testInstance.x + 2, testInstance.y + 2);
        testSceneState.handlePointerEvent(pointerEvent, testGame.controller);

        expect(actorEventHandlerCalled).toBeTrue();
        expect(embeddedSceneEventHandlerCalled).toBeFalse();

        const pointerEvent2 = new PointerInputEvent('testPointer', testEmbeddedSubScene.x + 2, testEmbeddedSubScene.y + 2);
        testSceneState.handlePointerEvent(pointerEvent2, testGame.controller);
        expect(embeddedSceneEventHandlerCalled).toBeTrue();
    });
});