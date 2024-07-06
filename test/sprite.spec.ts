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
