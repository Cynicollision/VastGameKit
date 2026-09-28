import { Game } from './../engine/game';
import { TestImage1 } from './mocks/testImages';
import { TestUtil } from './testUtil';

describe('Sprite', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });

    it('successfully loads a valid image', done => {
        const testSprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source });
        let succeeded = false;

        testSprite.loadImage()
            .then(() => succeeded = true)
            .finally(() => {
                expect(succeeded).toBeTrue();
                done();
            });
    });

    it('fails to load an invalid image', done => {
        const testSprite = testGame.construction.sprites.add('testSprite', { source: 'bogusPath' });
        let failed = false;

        testSprite.loadImage()
            .catch(() => failed = true)
            .finally(() => {
                expect(failed).toBeTrue();
                done();
            });
    });
});


describe('Sprite frames', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });

    it('is marked loaded once its image loads', async () => {
        const testSprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source });
        expect(testSprite.loaded).toBeFalse();

        await testSprite.loadImage();

        expect(testSprite.loaded).toBeTrue();
    });

    it('gets source coordinates for frames across rows', async () => {
        // 32x16 image of 8x8 frames: 4 frames per row.
        const testSprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source, width: 8, height: 8 });
        await testSprite.loadImage();

        expect(testSprite.getFrameImageSourceCoords(0)).toEqual([0, 0]);
        expect(testSprite.getFrameImageSourceCoords(3)).toEqual([24, 0]);
        expect(testSprite.getFrameImageSourceCoords(5)).toEqual([8, 8]);
    });

    it('gets source coordinates for frames separated by a border', async () => {
        // 32px wide image of 8px frames with a 2px border: 3 frames per row.
        const testSprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source, width: 8, height: 8, frameBorder: 2 });
        await testSprite.loadImage();

        expect(testSprite.getFrameImageSourceCoords(1)).toEqual([10, 0]);
        expect(testSprite.getFrameImageSourceCoords(4)).toEqual([10, 10]);
    });

    it('gets source coordinates when a frame is wider than the image', async () => {
        const testSprite = testGame.construction.sprites.add('testSprite', { source: TestImage1.Source, width: 64, height: 16 });
        await testSprite.loadImage();

        expect(testSprite.getFrameImageSourceCoords(0)).toEqual([0, 0]);
        expect(testSprite.getFrameImageSourceCoords(1)).toEqual([0, 16]);
    });
});
