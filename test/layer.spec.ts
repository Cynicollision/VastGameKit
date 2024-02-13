import { ActorInstance } from './../engine/actor';
import { Game } from './../engine/game';
import { Layer, LayerStatus , Room } from './../engine/room';
import { TestUtil } from './testUtil';

describe('Layer', () => {
    let testGame: Game;
    let testRoom: Room;
    let testLayer: Layer;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testRoom = testGame.defineRoom('testRoom');
        testLayer = testRoom.createLayer('testLayer');

        testGame.defineActor('testActor');
    });

    it('defines the default layer', () => {
        expect(testRoom.defaultLayer).not.toBeNull();
    });

    it('deletes ActorInstances from its registries', () => {
        const instance: ActorInstance = testRoom.defaultLayer.createInstance('testActor', 0, 0);
        let currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(1);

        testRoom.defaultLayer.deleteInstance(instance);

        currentCount = testRoom.defaultLayer.getActorInstances().length;
        expect(currentCount).toBe(0);
    });

    // TODO
    describe('step lifecycle', () => {
        it('NEEDS TESTS', () => {

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
    });
});
