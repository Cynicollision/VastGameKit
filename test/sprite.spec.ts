import { Game } from './../engine/game';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Sprite', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });

    it('successfully loads a valid image', (done) => {
        const testSprite = testGame.defineSprite('testSprite', TestImage.Source);
        let succeeded = false;

        testSprite.load()
            .then(() => succeeded = true)
            .finally(() => {
                expect(succeeded).toBeTrue();
                done();
            });
    });

    it('fails to load an invalid image', (done) => {
        const testSprite = testGame.defineSprite('testSprite', 'bogusPath');
        let failed = false;

        testSprite.load()
            .catch(() => failed = true)
            .finally(() => {
                expect(failed).toBeTrue();
                done();
            });
    });
});
