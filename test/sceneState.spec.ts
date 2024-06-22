import { GameEvent, KeyboardInputEvent, PointerInputEvent, SceneStatus } from './../engine/core';
import { Instance } from './../engine/actorInstance';
import { Game } from './../engine/game';
import { SceneState } from './../engine/scene/sceneState';
import { TestUtil } from './testUtil';

describe('SceneState', () => {
    const TestActorName = 'actTest';
    const TestEmbedName = 'scnEmbed';
    const TestSceneName = 'scnTest';
    const TestSceneHeight = 600;
    const TestSceneWidth = 800;
    
    let testGame: Game;
    let testSceneState: SceneState;
    let testInstance: Instance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construct.defineScene(TestSceneName, { width: TestSceneWidth, height: TestSceneHeight, persistent: false });
        testSceneState = testGame.controller.getSceneState(TestSceneName);

        testGame.construct.defineActor(TestActorName);
        testGame.construct.defineScene(TestEmbedName);

        testInstance = testSceneState.instances.create(TestActorName, 0, 0);
        testGame.construct.getActor(TestActorName).setRectBoundary(10, 10);

        testSceneState.embeds.create(TestEmbedName);
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
        testGame.construct.getScene(TestEmbedName).onStart((self, event, controller) => {
            embedOnStartCalled = true;
        });

        testSceneState.embeds.create('scnEmbed');
        expect(embedOnStartCalled).toBeTrue();
    });

    it('propgates KeyboardEvents to Embeds and Instances', () => {
        let actorEventHandlerCalled = false;
        testGame.construct.getActor(TestActorName).onKeyboardInput('testKey', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let sceneEventHandlerCalled = false;
        testGame.construct.getScene(TestEmbedName).onKeyboardInput('testKey', (self, event, controller) => {
            sceneEventHandlerCalled = true;
        });

        expect(actorEventHandlerCalled).toBeFalse();
        expect(sceneEventHandlerCalled).toBeFalse();

        const kbEvent = new KeyboardInputEvent('testKey', 'testkeytype');
        testSceneState.handleKeyboardEvent(kbEvent, testGame.controller);

        expect(actorEventHandlerCalled).toBeTrue();
        expect(sceneEventHandlerCalled).toBeTrue();
    });

    it('propgates GameEvents to Embeds and Instances', () => {

        let actorEventHandlerCalled = false;
        testGame.construct.getActor(TestActorName).onGameEvent('testEvent', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let sceneEventHandlerCalled = false;
        testGame.construct.getScene(TestEmbedName).onGameEvent('testEvent', (self, event, controller) => {
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

    it('propgates PointerEvents to Embeds and Instances', () => {
        let actorEventHandlerCalled = false;
        testGame.construct.getActor(TestActorName).onPointerInput('testPointer', (self, event, controller) => {
            actorEventHandlerCalled = true;
        });

        let sceneEventHandlerCalled = false;
        testGame.construct.getScene(TestEmbedName).onPointerInput('testPointer', (self, event, controller) => {
            sceneEventHandlerCalled = true;
        });

        expect(actorEventHandlerCalled).toBeFalse();
        expect(sceneEventHandlerCalled).toBeFalse();

        const pointerEvent = new PointerInputEvent('testPointer', testInstance.x + 2, testInstance.y + 2);
        testSceneState.handlePointerEvent(pointerEvent, testGame.controller);

        expect(actorEventHandlerCalled).toBeTrue();
        expect(sceneEventHandlerCalled).toBeTrue();
    });
});