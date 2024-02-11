import { Game } from './../engine/game';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Game', () => {
    let game: Game;

    beforeEach(() => {
        game = TestUtil.getTestGame();
    });

    it('defines ActorInstance IDs', () => {
        let id = game.nextActorInstanceID();
        expect(id).toBe(1);
        id = game.nextActorInstanceID();
        expect(id).toBe(2);
    });

    it('defines Actors', () => {
        game.defineActor('testActor');

        const actor = game.getActor('testActor');

        expect(actor).toBeDefined();
        expect(actor.name).toBe('testActor');
    });

    it('defines Rooms', () => {
        game.defineRoom('testRoom');

        const room = game.getRoom('testRoom');

        expect(room).toBeDefined();
        expect(room.name).toBe('testRoom');
    });

    it('defines Sprites', () => {
        game.defineSprite('testSprite', TestImage.Source);

        const sprite = game.getSprite('testSprite');

        expect(sprite).toBeDefined();
        expect(sprite.name).toBe('testSprite');
    });

    it('loads resources successfully', (done) => {
        game.defineSprite('testSprite', TestImage.Source);

        game.load().then(() => {
            const sprite = game.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(TestImage.Height);
            expect(sprite.image.width).toBe(TestImage.Width);
            done();
        });
    });

    it('loads resources and handles errors', (done) => {
        game.defineSprite('testSprite', 'bogusImageSource');

        game.load().catch(() => {
            const sprite = game.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(0);
            expect(sprite.image.width).toBe(0);
            done();
        });
    });
});