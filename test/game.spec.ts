import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { TestImage1 } from './mocks/testImages';
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
        testGame.construct.defineSprite('testSprite', TestImage1.Source);

        testGame.load().then(() => {
            const sprite = testGame.construct.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(TestImage1.Height);
            expect(sprite.image.width).toBe(TestImage1.Width);
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