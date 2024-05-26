import { LayerStatus, SceneStatus } from './../engine/core/enum';
import { Game } from './../engine/game';
import { Controller } from './../engine/scene/controller';
import { Scene } from './../engine/scene/scene';
import { TestUtil } from './testUtil';

describe('Scene', () => {
    let testGame: Game;
    let testScene: Scene;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testScene = testGame.defineScene('testScene');

        testGame.defineActor('testActor');
    });

    it('defines the default layer', () => {
        expect(testScene.defaultLayer).toBeDefined();
        expect(testScene.defaultLayer.name).toBe(Scene.DefaultLayerName);
    });

    it('creates Layers', () => {
        testScene.defineLayer('testLayer');
        const testLayer =  testScene.getLayer('testLayer');

        expect(testLayer).toBeDefined();
        expect(testLayer.name).toBe('testLayer');
    });

    it('destroys Layers', () => {
        const testLayer = testScene.defineLayer('testLayer');
        expect(testLayer.status).toBe(LayerStatus.New);

        testScene.destroyLayer('testLayer');

        expect(testLayer.status).toBe(LayerStatus.Destroyed);
    });

    it('gets layers sorted from bottom to top', () => {
        const layer2 = testScene.defineLayer('layer2', { depth: -10 });
        const layer3 = testScene.defineLayer('layer3', { depth: 20 });

        const sortedLayers = testScene.getLayersSortedFromBottom();

        expect(sortedLayers[0].depth).toBe(layer3.depth);
        expect(sortedLayers[1].depth).toBe(testScene.defaultLayer.depth);
        expect(sortedLayers[2].depth).toBe(layer2.depth);
    });

    it('gets layers sorted from top to bottom', () => {
        const layer2 = testScene.defineLayer('layer2', { depth: -10 });
        const layer3 = testScene.defineLayer('layer3', { depth: 20 });

        const sortedLayers = testScene.getLayersSortedFromTop();
        
        expect(sortedLayers[0].depth).toBe(layer2.depth);
        expect(sortedLayers[1].depth).toBe(testScene.defaultLayer.depth);
        expect(sortedLayers[2].depth).toBe(layer3.depth);
    });

    describe('step lifecycle', () => {
        let sc: Controller;

        beforeEach(() => {
            sc = TestUtil.getTestController(testGame);
        });

        it('for destroyed Layers, calls onDestroy callbacks and deletes them from the registry', () => {
            const layer = testScene.defineLayer('testLayer');
            expect(testScene.getLayers().length).toBe(2);
            expect(layer.status).toBe(LayerStatus.New);

            let onDestoryCalled = false;
            layer.onDestroy(() => onDestoryCalled = true);
            layer.destroy();
            expect(onDestoryCalled).toBeFalse();
            expect(layer.status).toBe(LayerStatus.Destroyed);

            testScene.step([], sc);

            expect(onDestoryCalled).toBeTrue();
            expect(testScene.getLayers().length).toBe(1);
        });

        it('for new Layers, calls onCreate callbacks and activates them', () => {
            const testLayer = testScene.defineLayer('testLayer');
            expect(testLayer.status).toBe(LayerStatus.New);

            let onCreateCalled = false;
            testLayer.onCreate(() => onCreateCalled = true);
            expect(onCreateCalled).toBeFalse();

            testScene.step([], sc);
            
            expect(onCreateCalled).toBe(true);
            expect(testLayer.status).toBe(LayerStatus.Active);
        });

        it('for active Layers, calls onStep callbacks', () => {
            const testLayer = testScene.defineLayer('testLayer');
            expect(testLayer.status).toBe(LayerStatus.New);
            testScene.step([], sc);
            expect(testLayer.status).toBe(LayerStatus.Active);

            let onStepCalled = false;
            testLayer.onStep(() => onStepCalled = true);
            expect(onStepCalled).toBeFalse();

            testScene.step([], sc);

            expect(onStepCalled).toBe(true);
            expect(testLayer.status).toBe(LayerStatus.Active);
        });
    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);
        });

        it('when NotStarted, on initialize, changes to Starting', () => {
            expect(testScene.status).toBe(SceneStatus.NotStarted);

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Starting);
        });

        it('when Starting, on scene start, changes to Running', () => {
            const gc = TestUtil.getTestController(testGame);
            testScene.start(gc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });

        it('when Running, on scene suspend, changes to Suspended', () => {
            const gc = TestUtil.getTestController(testGame);
            testScene.suspend(gc);

            expect(testScene.status).toBe(SceneStatus.Suspended);
        });

        it('when Suspended, on initialize, if not persistent, changes to Starting', () => {
            const gc = TestUtil.getTestController(testGame);
            testScene.options.persistent = false;
            testScene.suspend(gc);
            expect(testScene.status).toBe(SceneStatus.Suspended);

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Starting);
        });

        it('when Suspended, on initialize, if persistent, changes to Resuming', () => {
            testScene.options.persistent = true;
            testScene.suspend(TestUtil.getTestController(testGame));

            testScene.init();

            expect(testScene.status).toBe(SceneStatus.Resuming);
        });

        it('when Resuming, on scene start, changes to Running', () => {
            const gc = TestUtil.getTestController(testGame);
            testScene.options.persistent = true;
            testScene.suspend(gc);
            testScene.init();
            expect(testScene.status).toBe(SceneStatus.Resuming);

            testScene.start(gc);

            expect(testScene.status).toBe(SceneStatus.Running);
        });
    });
});
