import { Scene } from '../engine/scene';
import { Game } from './../engine/game';
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
        expect(testGame.defaultScene.height).toBe(Scene.DefaultSceneHeight);
        expect(testGame.defaultScene.width).toBe(Scene.DefaultSceneWidth);
    });

    it('loads resources successfully', (done) => {
        testGame.resources.defineSprite('testSprite', TestImage.Source);

        testGame.load().then(() => {
            const sprite = testGame.resources.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(TestImage.Height);
            expect(sprite.image.width).toBe(TestImage.Width);
            done();
        });
    });

    it('loads resources and handles errors', (done) => {
        testGame.resources.defineSprite('testSprite', 'bogusImageSource');

        testGame.load().catch(() => {
            const sprite = testGame.resources.getSprite('testSprite');
            expect(sprite.image).toBeDefined();
            expect(sprite.image.height).toBe(0);
            expect(sprite.image.width).toBe(0);
            done();
        });
    });
});