
import { ActorInstance, Instance } from './../engine/actorInstance';
import { InstanceStatus } from './../engine/core';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('ActorInstance', () => {
    let game: Game;
    let testInstance: ActorInstance;

    beforeEach(() => {
        game = TestUtil.getTestGame();
        game.resources.defineActor('testActor');
        TestUtil.startScene(game, game.defaultScene);
        testInstance = game.defaultScene.instances.create('testActor');
    });

    it('detects when it collides with another Instance', () => {
        testInstance.actor.setRectBoundary(20, 10);
        testInstance.x = testInstance.y = 0;

        const other = game.resources.defineActor('otherActor');
        other.setRectBoundary(40, 20);
        const otherInstance = game.defaultScene.instances.create('otherActor', { x: 10, y: 15 });
        expect(testInstance.collidesWith(otherInstance)).toBeFalse();
        otherInstance.y = 5;
        expect(testInstance.collidesWith(otherInstance)).toBeTrue();
    });

    it('can follow a Camera', () => {
        testInstance.follow(game.defaultScene.defaultCamera, { offsetX: 10, offsetY: 20 });
        expect(testInstance.x).toBe(0);
        expect(testInstance.y).toBe(0);

        game.defaultScene.defaultCamera.x = 110;
        game.defaultScene.defaultCamera.y = 220;
        testInstance.activate();
        (<Instance>testInstance).step(game.controller);

        expect(testInstance.x).toBe(120);
        expect(testInstance.y).toBe(240);
    });

    it('can follow another Instance', () => {
        const other = game.resources.defineActor('otherActor');
        const otherInstance = game.defaultScene.instances.create('otherActor', { x: 10, y: 15 });
        testInstance.follow(otherInstance, { offsetX: 10, offsetY: 20 });
        expect(testInstance.x).toBe(0);
        expect(testInstance.y).toBe(0);

        otherInstance.x = 50;
        otherInstance.y = 70;
        testInstance.activate();
        (<Instance>testInstance).step(game.controller);

        expect(testInstance.x).toBe(60);
        expect(testInstance.y).toBe(90);
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
