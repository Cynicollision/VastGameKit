import { GameConstruct } from './../engine/gameConstruct';
import { TestImage1 } from './mocks/testImages';

describe('GameConstruct', () => {
    let testConstruct: GameConstruct;

    beforeEach(() => {
        testConstruct = new GameConstruct();
    })

    it('defines and gets Actors', () => {
        testConstruct.defineActor('testActor');

        const actor = testConstruct.getActor('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines and gets Audio', () => {
        testConstruct.defineAudio('testAudio', null);

        const audio = testConstruct.getAudio('testAudio');

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