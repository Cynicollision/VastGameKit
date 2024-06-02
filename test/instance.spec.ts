
import { ActorInstance } from './../engine/actorInstance';
import { InstanceStatus } from './../engine/core';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('ActorInstance', () => {
    let game: Game;
    let testInstance: ActorInstance;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        game.defineActor('testActor');
        testInstance = game.defaultScene.createInstance('testActor');
    });

    describe('status', () => {
        it('begins as New', () => {
            expect(testInstance.status).toBe(InstanceStatus.New);
        });

        it('when activated, changes to Active', () => {
            expect(testInstance.status).toBe(InstanceStatus.New);

            testInstance.activate();

            expect(testInstance.status).toBe(InstanceStatus.Active);
        });

        it('when inactivated, changes to Inactive', () => {
            expect(testInstance.status).toBe(InstanceStatus.New);

            testInstance.inactivate();

            expect(testInstance.status).toBe(InstanceStatus.Inactive);
        });

        it('when destroyed, changes to Destroyed', () => {
            expect(testInstance.status).toBe(InstanceStatus.New);

            testInstance.destroy();

            expect(testInstance.status).toBe(InstanceStatus.Destroyed);
        });
    });
});
