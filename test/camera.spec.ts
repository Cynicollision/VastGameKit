import { Actor } from './../engine/actor/actor';
import { ActorInstance } from './../engine/actor/instance';
import { Game } from './../engine/game';
import { Camera } from './../engine/scene/camera';
import { TestUtil } from './testUtil';

describe('SceneCamera', () => {
    let testGame: Game;
    let testCamera: Camera;
    let testActor: Actor;
    let testInstance: ActorInstance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame({ canvasElementId: 'test', defaultSceneOptions: { height: 1000, width: 2000 } });
        testCamera = <Camera>testGame.defaultScene.defaultCamera;
        testActor = <Actor>testGame.defineActor('testActor');
        testActor.setRectBoundary(100, 200);

        testInstance = testGame.defaultScene.createInstance('testActor');
    });

    describe('defines valid dimensions', () => {
        it('to equal the scene size by default', () => {
            expect(testCamera.height).toBe(testGame.defaultScene.height);
            expect(testCamera.width).toBe(testGame.defaultScene.width);
            expect(testCamera.portHeight).toBe(testGame.defaultScene.height);
            expect(testCamera.portWidth).toBe(testGame.defaultScene.width);
        });

        it('to be the specified dimensions for a new camera', () => {
            const camera2 = testGame.defaultScene.defineCamera('camera2', { height: 200, width: 300, portHeight: 400, portWidth: 600 });
            expect(camera2.height).toBe(200);
            expect(camera2.width).toBe(300);
            expect(camera2.portHeight).toBe(400);
            expect(camera2.portWidth).toBe(600);
        });
    });

    describe('follows an ActorInstance', () => {

        it('with default options, stays within the scene at no offset and with no centering', () => {
            testInstance.x = -50;
            testInstance.y = -100;

            testCamera.follow(testInstance);
            testCamera.updatePosition();

            expect(testCamera.x).toBe(0);
            expect(testCamera.y).toBe(0);
        });

        it('with no offset', () => {
            testInstance.x = 50;
            testInstance.y = 100;

            testCamera.follow(testInstance, { offsetX: 0, offsetY: 0, centerOnInstanceBoundary: false, stayWithinScene: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(50);
            expect(testCamera.y).toBe(100);
        });

        it('with offset', () => {
            testInstance.x = 50;
            testInstance.y = 100;

            testCamera.follow(testInstance, { offsetX: 100, offsetY: 100, centerOnInstanceBoundary: false, stayWithinScene: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(-50);
            expect(testCamera.y).toBe(0);
        });

        it('centered around the ActorInstance\'s Boundary, with no offset', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 0, offsetY: 0, centerOnInstanceBoundary: true, stayWithinScene: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(testInstance.x - testGame.canvas.width / 2 + testActor.boundary.width / 2);
            expect(testCamera.x).toBe(100);
            expect(testCamera.y).toBe(testInstance.y - testGame.canvas.height / 2 + testActor.boundary.height / 2);
            expect(testCamera.y).toBe(50);
        });

        it('centered around the ActorInstance\'s Boundary, with offset', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 120, offsetY: 130, centerOnInstanceBoundary: true, stayWithinScene: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(-120 + testInstance.x - testGame.canvas.width / 2 + testActor.boundary.width / 2);
            expect(testCamera.x).toBe(-20);
            expect(testCamera.y).toBe(-130 + testInstance.y - testGame.canvas.height / 2 + testActor.boundary.height / 2);
            expect(testCamera.y).toBe(-80);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the scene minimum bounds', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 120, offsetY: 130, centerOnInstanceBoundary: true, stayWithinScene: true });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(0);
            expect(testCamera.y).toBe(0);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the scene maximum bounds', () => {
            testInstance.x = testGame.defaultScene.width;
            testInstance.y = testGame.defaultScene.height;

            testCamera.follow(testInstance, { centerOnInstanceBoundary: true, stayWithinScene: true });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(testGame.defaultScene.width - testGame.canvas.width);
            expect(testCamera.x).toBe(1400);
            expect(testCamera.y).toBe(testGame.defaultScene.height - testGame.canvas.height);
            expect(testCamera.y).toBe(200);
        });
    });
});