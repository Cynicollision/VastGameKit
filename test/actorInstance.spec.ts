import { ActorInstance, ActorInstanceStatus } from './../engine/actor';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('ActorInstance', () => {
    let game: Game;
    let testInstance: ActorInstance;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        game.defineActor('testActor');
        testInstance = game.defaultRoom.defaultLayer.createInstance('testActor');
    });

    describe('status', () => {
        it('begins as New', () => {
            expect(testInstance.status).toBe(ActorInstanceStatus.New);
        });

        it('when activated, changes to Active', () => {
            expect(testInstance.status).toBe(ActorInstanceStatus.New);

            testInstance.activate();

            expect(testInstance.status).toBe(ActorInstanceStatus.Active);
        });

        it('when destroyed, changes to Destroyed', () => {
            expect(testInstance.status).toBe(ActorInstanceStatus.New);

            testInstance.destroy();

            expect(testInstance.status).toBe(ActorInstanceStatus.Destroyed);
        });
    });
});
