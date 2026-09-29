import { GameCanvasHtml2D } from './../engine/device/canvas';

function getPixel(canvas: GameCanvasHtml2D, x: number, y: number): number[] {
    return Array.from(canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
}

describe('GameCanvasHtml2D', () => {

    describe('display scale', () => {
        it('is the largest whole number that fits in integer mode', () => {
            expect(GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 1000, 1000)).toBe(3);
            expect(GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 1000, 500)).toBe(2);
        });

        it('is a whole number of device pixels in integer mode', () => {
            // at 1.5 device pixels per CSS pixel, 2x fits 640 CSS pixels: 3 device pixels per canvas pixel.
            expect(GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 640, 1000, 1.5)).toBe(2);
            expect(GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 600, 1000, 1.5)).toBeCloseTo(4 / 3);
        });

        it('shrinks to fit in integer mode when smaller than 1x', () => {
            expect(GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 160, 1000)).toBe(0.5);
        });

        it('fits exactly in fit mode', () => {
            expect(GameCanvasHtml2D.getDisplayScale('fit', 320, 180, 800, 1000)).toBe(2.5);
        });

        it('sizes a canvas to fit its parent element without changing its resolution', () => {
            const parent = document.createElement('div');
            parent.style.width = '700px';
            parent.style.padding = '0 10px';
            const element = document.createElement('canvas');
            parent.appendChild(element);
            document.body.appendChild(parent);

            const canvas = GameCanvasHtml2D.initForElement(element, { width: 320, height: 180, scale: 'integer' });
            const expected = GameCanvasHtml2D.getDisplayScale('integer', 320, 180, 700, window.innerHeight, window.devicePixelRatio);

            expect([canvas.width, canvas.height]).toEqual([320, 180]);
            expect(element.style.width).toBe(`${320 * expected}px`);
            expect(element.style.height).toBe(`${180 * expected}px`);
            expect(element.style.imageRendering).toBe('pixelated');
            parent.remove();
        });
    });

    describe('transformed images', () => {
        // a 4x2 image: red on the left half, blue on the right.
        function createImage(): HTMLCanvasElement {
            const image = document.createElement('canvas');
            image.width = 4;
            image.height = 2;
            const context = image.getContext('2d')!;
            context.fillStyle = '#f00';
            context.fillRect(0, 0, 2, 2);
            context.fillStyle = '#00f';
            context.fillRect(2, 0, 2, 2);
            return image;
        }

        it('flips around the image center', () => {
            const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 8, height: 8 });

            canvas.drawImage(createImage(), 0, 0, 4, 2, 2, 2, 4, 2, { scaleX: -1 });

            expect(getPixel(canvas, 2, 2)).toEqual([0, 0, 255, 255]);
            expect(getPixel(canvas, 5, 2)).toEqual([255, 0, 0, 255]);
        });

        it('rotates clockwise around the image center', () => {
            const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 8, height: 8 });

            // centered at (4, 4): rotated 90 degrees, red is above and blue below.
            canvas.drawImage(createImage(), 0, 0, 4, 2, 2, 3, 4, 2, { rotation: 90 });

            expect(getPixel(canvas, 4, 2)).toEqual([255, 0, 0, 255]);
            expect(getPixel(canvas, 4, 5)).toEqual([0, 0, 255, 255]);
            expect(getPixel(canvas, 2, 3)).toEqual([0, 0, 0, 0]);
        });

        it('draws normally afterward', () => {
            const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 8, height: 8 });

            canvas.drawImage(createImage(), 0, 0, 4, 2, 0, 0, 4, 2, { scaleX: -1, rotation: 45 });
            canvas.clear();
            canvas.drawImage(createImage(), 0, 0, 4, 2, 0, 0, 4, 2);

            expect(getPixel(canvas, 0, 0)).toEqual([255, 0, 0, 255]);
        });
    });

    it('clears an offscreen canvas to transparent', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 10, height: 10 });
        canvas.fillArea('#f00', 0, 0, 10, 10);

        canvas.clear();

        expect(getPixel(canvas, 5, 5)).toEqual([0, 0, 0, 0]);
    });

    it('clears an element canvas to its background color', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initForElement(document.createElement('canvas'), { width: 10, height: 10, backgroundColor: '#00f' });
        canvas.fillArea('#f00', 0, 0, 10, 10);

        canvas.clear();

        expect(getPixel(canvas, 5, 5)).toEqual([0, 0, 255, 255]);
    });

    it('keeps image smoothing disabled after being resized', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 10, height: 10 });

        canvas.setSize(20, 20);

        expect(canvas.canvas.getContext('2d')!.imageSmoothingEnabled).toBeFalse();
    });

    it('draws a view stretched onto its port', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 20, height: 20 });

        // the 5x5 view at (5, 5) fills the 10x10 port at (10, 10).
        canvas.pushView(10, 10, 10, 10, 5, 5, 5, 5);
        canvas.fillArea('#f00', 5, 5, 1, 1);
        canvas.popView();

        expect(getPixel(canvas, 10, 10)).toEqual([255, 0, 0, 255]);
        expect(getPixel(canvas, 11, 11)).toEqual([255, 0, 0, 255]);
        expect(getPixel(canvas, 12, 12)).toEqual([0, 0, 0, 0]);
    });

    it('clips drawing to the port of a view until the view is popped', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 20, height: 20 });

        canvas.pushView(0, 0, 10, 10);
        canvas.fillArea('#f00', 0, 0, 20, 20);
        canvas.popView();

        expect(getPixel(canvas, 5, 5)).toEqual([255, 0, 0, 255]);
        expect(getPixel(canvas, 15, 15)).toEqual([0, 0, 0, 0]);

        canvas.fillArea('#f00', 0, 0, 20, 20);
        expect(getPixel(canvas, 15, 15)).toEqual([255, 0, 0, 255]);
    });
});
