import { GameCanvasHtml2D } from './../engine/device/canvas';

function getPixel(canvas: GameCanvasHtml2D, x: number, y: number): number[] {
    return Array.from(canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
}

describe('GameCanvasHtml2D', () => {

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
