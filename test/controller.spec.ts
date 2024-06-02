import { SceneController } from './../engine/controller';
import { TestUtil } from './testUtil';

describe('SceneController', () => {
    let game = TestUtil.getTestGame();
    let testController: SceneController;

    beforeEach(() => {
        testController = TestUtil.getTestController(game);
    })

    it('defines runtime IDs', () => {
        let id = testController.getNextRuntimeID();
        expect(id).toBe(1);
        id = testController.getNextRuntimeID();
        expect(id).toBe(2);
    });
})