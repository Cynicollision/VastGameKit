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

    it('resizes an existing sub canvas when requested at a different size', () => {
        const canvas = GameCanvasHtml2D.initNewCanvas({ width: 10, height: 10 });
        const sub = canvas.subCanvas('test', { width: 100, height: 50 });

        const sameSub = canvas.subCanvas('test', { width: 60, height: 40 });

        expect(sameSub).toBe(sub);
        expect(sub.width).toBe(60);
        expect(sub.height).toBe(40);
    });
});
