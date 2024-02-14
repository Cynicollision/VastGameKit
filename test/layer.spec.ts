import { ActorInstance } from './../engine/actor';
import { Game, GameState } from './../engine/game';
import { Layer, LayerStatus , Room } from './../engine/room';
import { TestUtil } from './testUtil';

describe('Layer', () => {
    let testGame: Game;
    let testState: GameState;
    let testRoom: Room;
    let testLayer: Layer;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testState = TestUtil.getTestState(testGame);
        testRoom = testGame.defineRoom('testRoom');
        testLayer = testRoom.createLayer('testLayer');

        testGame.defineActor('testActor');
    });

    it('defines the default layer', () => {
        expect(testRoom.defaultLayer).not.toBeNull();
    });

    it('creates ActorInstances', () => {
        testRoom.defaultLayer.createInstance('testActor', 0, 0);
        const layerInstances = testRoom.defaultLayer.getActorInstances();

        expect(layerInstances.length).toBe(1);
        expect(layerInstances[0].actor.name).toBe('testActor');
    });

    it('deletes ActorInstances from its registries', () => {
        const instance: ActorInstance = testRoom.defaultLayer.createInstance('testActor', 0, 0);
        let currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(1);

        testRoom.defaultLayer.deleteInstance(instance);

        currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(0);
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCreate callback', () => {
            let onCreateCalled = false;
            testLayer.onCreate((self, state) => {
                onCreateCalled = true;
            });

            expect(onCreateCalled).toBeFalse();

            testLayer.callCreate(testState);

            expect(onCreateCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            // TODO
        });

        xit('defines a pointer event handler callback', () => {
            // TODO
        });

        xit('defines a keyboard event handler callback', () => {
            // TODO
        });

        xit('defines an onStep callback', () => {
            // TODO
        });

        xit('defines an onDraw callback', () => {
            // TODO
        });

        xit('defines an onDestroy callback', () => {
            // TODO
        });
    });

    describe('step lifecycle', () => {
        it('NEEDS TESTS', () => {
            // TODO
        });
    });

    describe('status', () => {
        
        it('begins as New', () => {
            expect(testLayer.status).toBe(LayerStatus.New);
        });

        it('when activated, changes to Active', () => {
            testLayer.activate();
            expect(testLayer.status).toBe(LayerStatus.Active);
        });

        it('when destroyed, changes to Destroyed', () => {
            testLayer.destroy();
            expect(testLayer.status).toBe(LayerStatus.Destroyed);
        });

        it('when initialized, changes to New', () => {
            testLayer.activate();
            expect(testLayer.status).toBe(LayerStatus.Active);

            testLayer.init();
            
            expect(testLayer.status).toBe(LayerStatus.New);
        });
    });
});
