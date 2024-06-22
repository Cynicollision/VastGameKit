import { Instance } from './../engine/actorInstance';
import { Game } from './../engine/game';
import { SceneState } from './../engine/scene/sceneState';
import { TestUtil } from './testUtil';

describe('SpriteAnimation', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construct.defineActor('actTest1', { sprite: TestUtil.getTestSprite() });
        testGame.construct.defineActor('actTest2');
        
    });

    it('is instantiated for an ActorInstance\'s Sprite', () => {
        const testInstance1 = testGame.controller.sceneState.instances.create('actTest1', 0, 0);
        const testInstance2 = testGame.controller.sceneState.instances.create('actTest2', 0, 0);
        expect(testInstance1.animation).toBeDefined();
        expect(testInstance2.animation).toBeUndefined();
    });
});