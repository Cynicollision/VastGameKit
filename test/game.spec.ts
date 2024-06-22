import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Game', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });

    it('initializes with a default Scene', () => {
        expect(testGame.defaultScene).toBeDefined();
        expect(testGame.defaultScene.name).toBe(Game.DefaultSceneName);
        expect(testGame.defaultScene.height).toBe(GameScene.DefaultSceneHeight);
        expect(testGame.defaultScene.width).toBe(GameScene.DefaultSceneWidth);
    });

    it('loads Sprites successfully', done => {
        testGame.construct.defineSprite('testSprite', TestImage.Source);

        testGame.load().then(() => {
            const sprite = testGame.construct.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(TestImage.Height);
            expect(sprite.image.width).toBe(TestImage.Width);
            done();
        });
    });

    it('loads Sprites and handles errors', done => {
        testGame.construct.defineSprite('testSprite', 'bogusImageSource');

        testGame.load().catch(() => {
            const sprite = testGame.construct.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(0);
            expect(sprite.image.width).toBe(0);
            done();
        });
    });
});