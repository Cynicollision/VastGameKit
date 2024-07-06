import { GameConstruction } from './../engine/structure/construction';
import { TestImage1 } from './mocks/testImages';

describe('GameConstruct', () => {
    let testConstruct: GameConstruction;

    beforeEach(() => {
        testConstruct = new GameConstruction();
    })

    it('defines and gets Actors', () => {
        testConstruct.actors.add('testActor');

        const actor = testConstruct.actors.get('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines and gets Audio', () => {
        testConstruct.sounds.add('testAudio', { source: null });

        const audio = testConstruct.sounds.get('testAudio');

        expect(audio).toBeDefined();
        expect(audio.name).toBe('testAudio');
    });

    it('defines and gets Scenes', () => {
        testConstruct.scenes.add('testScene');

        const scene = testConstruct.scenes.get('testScene');

        expect(scene).toBeDefined();
        expect(scene.name).toBe('testScene');
    });

    it('defines and gets Sprites', () => {
        testConstruct.sprites.add('testSprite', { source: TestImage1.Source });

        const sprite = testConstruct.sprites.get('testSprite');

        expect(sprite).toBeDefined();
        expect(sprite.name).toBe('testSprite');
    });
})