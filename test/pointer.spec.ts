import { Direction, PointerInputEvent } from './../engine/core';
import { GamePointerState, PointerInputHandler } from './../engine/device/pointer';
import { TestUtil } from './testUtil';

function pointerEvent(type: string, clientX: number, clientY: number, pointerId: number = 1, pointerType: string = 'mouse'): PointerEvent {
    return new PointerEvent(type, { clientX: clientX, clientY: clientY, pointerId: pointerId, pointerType: pointerType, bubbles: true });
}

describe('PointerInputHandler', () => {
    let canvas: HTMLCanvasElement;
    let received: PointerInputEvent[];

    beforeEach(() => {
        // a 200x100 canvas displayed at half size, offset from the page origin.
        canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        canvas.style.position = 'fixed';
        canvas.style.left = '50px';
        canvas.style.top = '20px';
        canvas.style.width = '100px';
        canvas.style.height = '50px';
        document.body.appendChild(canvas);

        received = [];
        PointerInputHandler.initForElement(canvas).subscribe(ev => received.push(ev));
    });

    afterEach(() => {
        canvas.remove();
    });

    it('reports positions in canvas coordinates', () => {
        canvas.dispatchEvent(pointerEvent('pointerdown', 60, 30));

        expect(received.length).toBe(1);
        expect([received[0].type, received[0].x, received[0].y]).toEqual(['pointerdown', 20, 20]);
    });

    it('reports moves and releases, with the pointer and its type', () => {
        canvas.dispatchEvent(pointerEvent('pointermove', 60, 30, 3, 'touch'));
        canvas.dispatchEvent(pointerEvent('pointerup', 100, 45, 3, 'touch'));

        expect(received.map(ev => [ev.type, ev.x, ev.y, ev.pointerId, ev.pointerType])).toEqual([
            ['pointermove', 20, 20, 3, 'touch'],
            ['pointerup', 100, 50, 3, 'touch'],
        ]);
    });

    it('reports a release after a long enough movement as a swipe', () => {
        canvas.dispatchEvent(pointerEvent('pointerdown', 60, 30));
        canvas.dispatchEvent(pointerEvent('pointerup', 60, 30 - PointerInputHandler.SwipeDistance));
        canvas.dispatchEvent(pointerEvent('pointerdown', 60, 30));
        canvas.dispatchEvent(pointerEvent('pointerup', 70, 35));

        expect(received[1].swipe).toBe(Direction.Up);
        expect(received[3].swipe).toBeUndefined();
    });

    it('stops touches from scrolling the page', () => {
        expect(canvas.style.touchAction).toBe('none');
    });
});

describe('GamePointerState', () => {
    let pointer: GamePointerState;

    function send(type: string, x: number, y: number, pointerId: number = 1, swipe?: Direction): void {
        pointer.onEvent(new PointerInputEvent(type, x, y, undefined, { pointerId: pointerId, pointerType: 'touch', swipe: swipe }));
    }

    beforeEach(() => {
        pointer = new GamePointerState();
    });

    it('reports presses and releases since the previous step for one step', () => {
        send('pointerdown', 10, 20);
        pointer.step();
        expect([pointer.isDown, pointer.wasPressed, pointer.pressX, pointer.pressY]).toEqual([true, true, 10, 20]);

        send('pointermove', 15, 25);
        pointer.step();
        expect([pointer.wasPressed, pointer.x, pointer.y]).toEqual([false, 15, 25]);

        send('pointerup', 16, 26, 1, Direction.Right);
        pointer.step();
        expect([pointer.isDown, pointer.wasReleased, pointer.swipe, pointer.pressX]).toEqual([false, true, Direction.Right, 10]);

        pointer.step();
        expect([pointer.wasReleased, pointer.swipe]).toEqual([false, undefined]);
    });

    it('reports a tap between steps as pressed and released', () => {
        send('pointerdown', 10, 20);
        send('pointerup', 10, 20);
        pointer.step();

        expect([pointer.wasPressed, pointer.wasReleased, pointer.isDown]).toEqual([true, true, false]);
    });

    it('follows the first of several touches, and tracks them all', () => {
        send('pointerdown', 10, 10, 1);
        send('pointerdown', 50, 50, 2);
        send('pointermove', 60, 60, 2);

        expect([pointer.x, pointer.y]).toEqual([10, 10]);
        expect(Array.from(pointer.pointers.values())).toEqual([{ x: 10, y: 10 }, { x: 60, y: 60 }]);

        send('pointerup', 10, 10, 1);
        expect([pointer.isDown, pointer.pointers.size]).toEqual([false, 1]);
    });

    it('follows a mouse while no button is down', () => {
        pointer.onEvent(new PointerInputEvent('pointermove', 30, 40));

        expect([pointer.x, pointer.y, pointer.isDown]).toEqual([30, 40, false]);
    });
});

describe('Pointer in Scenes', () => {
    it('is stepped with the controller and updated by pointer events', () => {
        const testGame = TestUtil.getTestGame();
        let pressedInStep = false;
        testGame.controller.sceneState.scene.onStep((self, controller) => {
            pressedInStep = controller.pointer.wasPressed;
        });
        testGame.controller.sceneState.startOrResume(testGame.controller);

        testGame.controller.onPointerEvent(new PointerInputEvent('pointerdown', 5, 5));
        testGame.controller.step();

        expect(pressedInStep).toBeTrue();
    });

    it('converts canvas positions to Scene positions through the camera showing them', () => {
        const testGame = TestUtil.getTestGame();
        const sceneState = testGame.controller.sceneState;
        // the default camera shows the Scene from (100, 50) at 2x, below a 20 pixel bar.
        Object.assign(sceneState.defaultCamera, { x: 100, y: 50, width: 160, height: 120, portX: 0, portY: 20, portWidth: 320, portHeight: 240 });
        sceneState.addCamera('minimap', { x: 0, y: 0, width: 400, height: 400, portX: 280, portY: 0, portWidth: 40, portHeight: 40 });

        expect(sceneState.toScenePosition(40, 60)).toEqual({ x: 120, y: 70 });
        expect(sceneState.toScenePosition(290, 10)).toEqual({ x: 100, y: 100 });
    });
});
