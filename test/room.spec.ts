import { Room, RoomStatus } from './../engine/room';
import { Game, GameState } from './../engine/game';
import { LayerStatus } from './../engine/room';
import { TestUtil } from './testUtil';

describe('Room', () => {
    let testGame: Game;
    let testRoom: Room;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testRoom = testGame.defineRoom('testRoom');

        testGame.defineActor('testActor');
    });

    it('defines the default layer', () => {
        expect(testRoom.defaultLayer).toBeDefined();
        expect(testRoom.defaultLayer.name).toBe(Room.DefaultLayerName);
    });

    it('creates Layers', () => {
        testRoom.createLayer('testLayer');
        const testLayer =  testRoom.getLayer('testLayer');

        expect(testLayer).toBeDefined();
        expect(testLayer.name).toBe('testLayer');
    });

    it('destroys Layers', () => {
        const testLayer = testRoom.createLayer('testLayer');
        expect(testLayer.status).toBe(LayerStatus.New);

        testRoom.destroyLayer('testLayer');

        expect(testLayer.status).toBe(LayerStatus.Destroyed);
    });

    it('gets layers sorted from bottom to top', () => {
        const layer2 = testRoom.createLayer('layer2', { depth: -10 });
        const layer3 = testRoom.createLayer('layer3', { depth: 20 });

        const sortedLayers = testRoom.getLayersSortedFromBottom();

        expect(sortedLayers[0].depth).toBe(layer3.depth);
        expect(sortedLayers[1].depth).toBe(testRoom.defaultLayer.depth);
        expect(sortedLayers[2].depth).toBe(layer2.depth);
    });

    it('gets layers sorted from top to bottom', () => {
        const layer2 = testRoom.createLayer('layer2', { depth: -10 });
        const layer3 = testRoom.createLayer('layer3', { depth: 20 });

        const sortedLayers = testRoom.getLayersSortedFromTop();
        
        expect(sortedLayers[0].depth).toBe(layer2.depth);
        expect(sortedLayers[1].depth).toBe(testRoom.defaultLayer.depth);
        expect(sortedLayers[2].depth).toBe(layer3.depth);
    });

    describe('step lifecycle', () => {
        let state: GameState;

        beforeEach(() => {
            state = new GameState(testGame);
        });

        it('for destroyed Layers, calls onDestroy callbacks and deletes them from the registry', () => {
            const layer = testRoom.createLayer('testLayer');
            expect(testRoom.getLayers().length).toBe(2);
            expect(layer.status).toBe(LayerStatus.New);

            let onDestoryCalled = false;
            layer.onDestroy(() => onDestoryCalled = true);
            layer.destroy();
            expect(onDestoryCalled).toBeFalse();
            expect(layer.status).toBe(LayerStatus.Destroyed);

            testRoom.step(state);

            expect(onDestoryCalled).toBeTrue();
            expect(testRoom.getLayers().length).toBe(1);
        });

        it('for new Layers, calls onCreate callbacks and activates them', () => {
            const testLayer = testRoom.createLayer('testLayer');
            expect(testLayer.status).toBe(LayerStatus.New);

            let onCreateCalled = false;
            testLayer.onCreate(() => onCreateCalled = true);
            expect(onCreateCalled).toBeFalse();

            testRoom.step(state);
            
            expect(onCreateCalled).toBe(true);
            expect(testLayer.status).toBe(LayerStatus.Active);
        });

        it('for active Layers, calls onStep callbacks', () => {
            const testLayer = testRoom.createLayer('testLayer');
            expect(testLayer.status).toBe(LayerStatus.New);
            testRoom.step(state);
            expect(testLayer.status).toBe(LayerStatus.Active);

            let onStepCalled = false;
            testLayer.onStep(() => onStepCalled = true);
            expect(onStepCalled).toBeFalse();

            testRoom.step(state);

            expect(onStepCalled).toBe(true);
            expect(testLayer.status).toBe(LayerStatus.Active);
        });
    });

    describe('status', () => {

        it('begins as NotStarted', () => {
            expect(testRoom.status).toBe(RoomStatus.NotStarted);
        });

        it('when NotStarted, on initialize, changes to Starting', () => {
            expect(testRoom.status).toBe(RoomStatus.NotStarted);

            testRoom.init();

            expect(testRoom.status).toBe(RoomStatus.Starting);
        });

        it('when Starting, on room start, changes to Running', () => {
            const state = TestUtil.getTestState(testGame);
            testRoom.start(state);

            expect(testRoom.status).toBe(RoomStatus.Running);
        });

        it('when Running, on room suspend, changes to Suspended', () => {
            const state = new GameState(testGame);
            testRoom.suspend(state);

            expect(testRoom.status).toBe(RoomStatus.Suspended);
        });

        it('when Suspended, on initialize, if not persistent, changes to Starting', () => {
            const state = new GameState(testGame);
            testRoom.options.persistent = false;
            testRoom.suspend(state);
            expect(testRoom.status).toBe(RoomStatus.Suspended);

            testRoom.init();

            expect(testRoom.status).toBe(RoomStatus.Starting);
        });

        it('when Suspended, on initialize, if persistent, changes to Resuming', () => {
            testRoom.options.persistent = true;
            testRoom.suspend(new GameState(testGame));

            testRoom.init();

            expect(testRoom.status).toBe(RoomStatus.Resuming);
        });

        it('when Resuming, on room start, changes to Running', () => {
            const state = new GameState(testGame);
            testRoom.options.persistent = true;
            testRoom.suspend(state);
            testRoom.init();
            expect(testRoom.status).toBe(RoomStatus.Resuming);

            testRoom.start(state);

            expect(testRoom.status).toBe(RoomStatus.Running);
        });
    });
});
