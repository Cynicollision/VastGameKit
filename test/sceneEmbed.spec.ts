import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('SceneEmbed', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });
    
    it('can be instantiated with a parent Scene', () => {
        const embed = testGame.defaultScene
    });
});