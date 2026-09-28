import { PointerInputEvent } from './../engine/core';
import { PointerInputHandler } from './../engine/device/pointer';

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

    it('reports mouse positions in canvas coordinates', () => {
        canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 60, clientY: 30 }));

        expect(received.length).toBe(1);
        expect(received[0].type).toBe('mousedown');
        expect(received[0].x).toBe(20);
        expect(received[0].y).toBe(20);
    });

    it('reports the lifted touch position on touchend', () => {
        const touch = new Touch({ identifier: 1, target: canvas, clientX: 100, clientY: 45 });
        canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch] }));

        expect(received.length).toBe(1);
        expect(received[0].x).toBe(100);
        expect(received[0].y).toBe(50);
    });
});
