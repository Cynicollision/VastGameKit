import { GameConstruction } from './../engine/structure/construction';
import { TestImage1 } from './mocks/testImages';

describe('GameConstruct', () => {
    let testConstruct: GameConstruction;

    beforeEach(() => {
        testConstruct = new GameConstruction();
    })

    it('defines and gets Actors', () => {
        testConstruct.defineActor('testActor');

        const actor = testConstruct.getActor('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines and gets Audio', () => {
        testConstruct.defineSound('testAudio', null);

        const audio = testConstruct.getSound('testAudio');

        expect(audio).toBeDefined();
        expect(audio.name).toBe('testAudio');
    });

    it('defines and gets Scenes', () => {
        testConstruct.defineScene('testScene');

        const scene = testConstruct.getScene('testScene');

        expect(scene).toBeDefined();
        expect(scene.name).toBe('testScene');
    });

    it('defines and gets Sprites', () => {
        testConstruct.defineSprite('testSprite', TestImage1.Source);

        const sprite = testConstruct.getSprite('testSprite');

        expect(sprite).toBeDefined();
        expect(sprite.name).toBe('testSprite');
    });
})