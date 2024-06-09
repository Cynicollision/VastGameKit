import { GameResources } from './../engine/resources';
import { TestImage } from './mocks/testImage';

describe('GameResource', () => {
    let testResources: GameResources;

    beforeEach(() => {
        testResources = new GameResources();
    })

    it('defines and gets Actors', () => {
        testResources.defineActor('testActor');

        const actor = testResources.getActor('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines and gets Audio', () => {
        testResources.defineAudio('testAudio', null);

        const audio = testResources.getAudio('testAudio');

        expect(audio).toBeDefined();
        expect(audio.name).toBe('testAudio');
    });

    it('defines and gets Scenes', () => {
        testResources.defineScene('testScene');

        const scene = testResources.getScene('testScene');

        expect(scene).toBeDefined();
        expect(scene.name).toBe('testScene');
    });

    it('defines and gets Sprites', () => {
        testResources.defineSprite('testSprite', TestImage.Source);

        const sprite = testResources.getSprite('testSprite');

        expect(sprite).toBeDefined();
        expect(sprite.name).toBe('testSprite');
    });
})