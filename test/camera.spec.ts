import { ActorDefinition } from './../engine/structure/actor';
import { ActorInstance } from './../engine/state/instance';
import { SceneCamera } from './../engine/state/camera';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

describe('SceneCamera', () => {
    let testGame: Game;
    let testCamera: SceneCamera;
    let testActor: ActorDefinition;
    let testInstance: ActorInstance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame({ canvasElementId: 'test', defaultSceneOptions: { height: 1000, width: 2000 } });
        testCamera = <SceneCamera>testGame.controller.sceneState.defaultCamera;
        testActor = <ActorDefinition>testGame.construction.actors.add('testActor');
        testActor.setRectBoundary(200, 100);

        testInstance = <ActorInstance>testGame.controller.sceneState.instances.create('testActor');
    });

    describe('defines valid dimensions', () => {
        it('to equal the scene size by default', () => {
            expect(testCamera.height).toBe(testGame.defaultScene.height);
            expect(testCamera.width).toBe(testGame.defaultScene.width);
            expect(testCamera.portHeight).toBe(testGame.defaultScene.height);
            expect(testCamera.portWidth).toBe(testGame.defaultScene.width);
        });

        it('to be the specified dimensions for a new camera', () => {
            const camera2 = testGame.controller.sceneState.addCamera('camera2', { height: 200, width: 300, portHeight: 400, portWidth: 600 });
            expect(camera2.height).toBe(200);
            expect(camera2.width).toBe(300);
            expect(camera2.portHeight).toBe(400);
            expect(camera2.portWidth).toBe(600);
        });
    });

    describe('follows an ActorInstance', () => {

        beforeEach(() => {
            testCamera.width = 600;
            testCamera.height = 300;
        });

        it('with default options, stays within the scene at no offset and with no centering', () => {
            testInstance.x = -50;
            testInstance.y = -100;

            testCamera.follow(testInstance);
            testCamera.updateFollowPosition();

            expect(testCamera.x).toBe(0);
            expect(testCamera.y).toBe(0);
        });

        it('with no offset', () => {
            testInstance.x = 50;
            testInstance.y = 100;

            testCamera.follow(testInstance, { offsetX: 0, offsetY: 0, centerOnTarget: false });
            testCamera.updateFollowPosition();

            expect(testCamera.x).toBe(50);
            expect(testCamera.y).toBe(100);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the scene minimum bounds', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { centerOnTarget: true });
            testCamera.updateFollowPosition();

            expect(testCamera.x).toBe(testInstance.x - testCamera.width / 2 + testInstance.width / 2);
            expect(testCamera.x).toBe(100);

            expect(testCamera.y).toBe(testInstance.y - testCamera.height / 2 + testInstance.height / 2);
            expect(testCamera.y).toBe(300);
        });

        it('stays at the scene origin when larger than the scene', () => {
            testCamera.width = 3000;
            testCamera.height = 2000;
            testInstance.x = 500;
            testInstance.y = 500;

            testCamera.follow(testInstance, { centerOnTarget: true });
            testCamera.updateFollowPosition();

            expect(testCamera.x).toBe(0);
            expect(testCamera.y).toBe(0);
        });

        it('moving no faster than its maximum speed, then keeping up', () => {
            testCamera.follow(testInstance, { maxSpeed: 50 });
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.updateFollowPosition();
            expect(testCamera.x).toBeCloseTo(30);
            expect(testCamera.y).toBeCloseTo(40);

            for (let i = 0; i < 9; i++) {
                testCamera.updateFollowPosition();
            }
            expect(testCamera.x).toBeCloseTo(300);
            expect(testCamera.y).toBeCloseTo(400);

            testInstance.x = 320;
            testCamera.updateFollowPosition();
            expect(testCamera.x).toBeCloseTo(320);
            expect(testCamera.y).toBeCloseTo(400);
        });

        it('jumping to its target without a maximum speed', () => {
            testCamera.follow(testInstance, { maxSpeed: 50 });
            testCamera.follow(testInstance);
            testInstance.x = 300;

            testCamera.updateFollowPosition();
            expect(testCamera.x).toBe(300);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the scene maximum bounds', () => {
            testInstance.x = testGame.defaultScene.width;
            testInstance.y = testGame.defaultScene.height;

            testCamera.follow(testInstance, { centerOnTarget: false });
            testCamera.updateFollowPosition();

            expect(testCamera.x).toBe(testGame.defaultScene.width - testCamera.width);
            expect(testCamera.x).toBe(1400);
            expect(testCamera.y).toBe(testGame.defaultScene.height - testCamera.height);
            expect(testCamera.y).toBe(700);
        });
    });
});