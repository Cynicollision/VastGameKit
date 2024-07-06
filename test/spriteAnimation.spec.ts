import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('SpriteAnimation', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actTest1', { sprite: TestUtil.getTestSprite() });
        testGame.construction.actors.add('actTest2');
        
    });

    it('is instantiated for an ActorInstance\'s Sprite', () => {
        const testInstance1 = testGame.controller.sceneState.instances.create('actTest1');
        const testInstance2 = testGame.controller.sceneState.instances.create('actTest2');
        expect(testInstance1.animation).toBeDefined();
        expect(testInstance2.animation).toBeUndefined();
    });
});