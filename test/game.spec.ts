import { Game } from './../engine/game';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Game', () => {
    let game: Game;

    beforeEach(() => {
        game = TestUtil.getTestGame();
    });

    it('defines Actors', () => {
        game.resources.defineActor('testActor');

        const actor = game.resources.getActor('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines Scenes', () => {
        game.resources.defineScene('testScene');

        const scene = game.resources.getScene('testScene');

        expect(scene).toBeDefined();
        expect(scene.name).toBe('testScene');
    });

    it('defines Audio', () => {
        game.resources.defineAudio('testAudio', null);

        const audio = game.resources.getAudio('testAudio');

        expect(audio).toBeDefined();
        expect(audio.name).toBe('testAudio');
    });

    it('defines Sprites', () => {
        game.resources.defineSprite('testSprite', TestImage.Source);

        const sprite = game.resources.getSprite('testSprite');

        expect(sprite).toBeDefined();
        expect(sprite.name).toBe('testSprite');
    });

    it('loads resources successfully', (done) => {
        game.resources.defineSprite('testSprite', TestImage.Source);

        game.load().then(() => {
            const sprite = game.resources.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(TestImage.Height);
            expect(sprite.image.width).toBe(TestImage.Width);
            done();
        });
    });

    it('loads resources and handles errors', (done) => {
        game.resources.defineSprite('testSprite', 'bogusImageSource');

        game.load().catch(() => {
            const sprite = game.resources.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(0);
            expect(sprite.image.width).toBe(0);
            done();
        });
    });
});