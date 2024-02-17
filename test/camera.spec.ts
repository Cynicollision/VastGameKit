import { Actor, ActorInstance } from './../engine/actor';
import { Game } from './../engine/game';
import { RoomCamera } from './../engine/room';
import { TestUtil } from './testUtil';

describe('RoomCamera', () => {
    let testGame: Game;
    let testCamera: RoomCamera;
    let testActor: Actor;
    let testInstance: ActorInstance;

    beforeEach(() => {
        testGame = TestUtil.getTestGame({ canvasElementId: 'test', defaultRoomOptions: { height: 1000, width: 2000 } });
        testCamera = testGame.defaultRoom.camera;
        testActor = testGame.defineActor('testActor');
        testActor.setRectBoundary(100, 200);

        testInstance = testGame.defaultRoom.defaultLayer.createInstance('testActor');
    });

    describe('follows an ActorInstance', () => {

        it('with default options, stays within the room at no offset and with no centering', () => {
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

            testCamera.follow(testInstance, { offsetX: 0, offsetY: 0, centerOnInstanceBoundary: false, stayWithinRoom: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(50);
            expect(testCamera.y).toBe(100);
        });

        it('with offset', () => {
            testInstance.x = 50;
            testInstance.y = 100;

            testCamera.follow(testInstance, { offsetX: 100, offsetY: 100, centerOnInstanceBoundary: false, stayWithinRoom: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(-50);
            expect(testCamera.y).toBe(0);
        });

        it('centered around the ActorInstance\'s Boundary, with no offset', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 0, offsetY: 0, centerOnInstanceBoundary: true, stayWithinRoom: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(testInstance.x - testGame.canvas.width / 2 + testActor.boundary.width / 2);
            expect(testCamera.x).toBe(100);
            expect(testCamera.y).toBe(testInstance.y - testGame.canvas.height / 2 + testActor.boundary.height / 2);
            expect(testCamera.y).toBe(50);
        });

        it('centered around the ActorInstance\'s Boundary, with offset', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 120, offsetY: 130, centerOnInstanceBoundary: true, stayWithinRoom: false });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(-120 + testInstance.x - testGame.canvas.width / 2 + testActor.boundary.width / 2);
            expect(testCamera.x).toBe(-20);
            expect(testCamera.y).toBe(-130 + testInstance.y - testGame.canvas.height / 2 + testActor.boundary.height / 2);
            expect(testCamera.y).toBe(-80);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the room minimum bounds', () => {
            testInstance.x = 300;
            testInstance.y = 400;

            testCamera.follow(testInstance, { offsetX: 120, offsetY: 130, centerOnInstanceBoundary: true, stayWithinRoom: true });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(0);
            expect(testCamera.y).toBe(0);
        });

        it('centered around the ActorInstance\'s Boundary, staying within the room maximum bounds', () => {
            testInstance.x = testGame.defaultRoom.width;
            testInstance.y = testGame.defaultRoom.height;

            testCamera.follow(testInstance, { centerOnInstanceBoundary: true, stayWithinRoom: true });
            testCamera.updatePosition();

            expect(testCamera.x).toBe(testGame.defaultRoom.width - testGame.canvas.width);
            expect(testCamera.x).toBe(1400);
            expect(testCamera.y).toBe(testGame.defaultRoom.height - testGame.canvas.height);
            expect(testCamera.y).toBe(200);
        });
    });
});