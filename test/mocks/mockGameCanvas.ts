import { CanvasDrawImageOptions, CanvasDrawTextOptions, CanvasFillOptions, GameCanvas } from './../../engine/device/canvas';
import { Sprite } from './../../engine/resources/sprite';

type DrawnImage = {
    src: CanvasImageSource | GameCanvas;
    sx: number; 
    sy: number; 
    sw: number; 
    sh: number; 
    dx: number; 
    dy: number; 
    dw: number; 
    dh: number;
    options?: CanvasDrawImageOptions;
}

type PushedView = {
    port: number[];
    view: number[];
};

export class MockGameCanvas implements GameCanvas {
    height: number = 800;
    width: number = 600;

    private _drawnImages: DrawnImage[] = [];
    get drawnImages() { return this._drawnImages; }

    private _pushedViews: PushedView[] = [];
    get pushedViews() { return this._pushedViews; }

    viewDepth = 0;
    
    // GameCanvas implementation
    clear(): void {
        this._drawnImages = [];
        this._pushedViews = [];
    }
    drawCanvas(canvas: GameCanvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void {
        this._drawnImages.push({ src: canvas, sx: sx, sy: sy, sw: sw, sh: sh, dx: dx, dy: dy, dw: dw, dh: dh, options: options });
    }
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void {
        this._drawnImages.push({ src: image, sx: sx, sy: sy, sw: sw, sh: sh, dx: dx, dy: dy, dw: dw, dh: dh, options: options });
    }
    drawRect(color: string, x: number, y: number, w: number, h: number): void {
    }
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawImageOptions): void {
    }
    drawText(text: string, x: number, y: number, options?: CanvasDrawTextOptions): void {
    }
    fill(color: string, width: number, height: number, options?: CanvasFillOptions): void {
    }
    fillArea(color: string, x: number, y: number, width: number, height: number, options?: CanvasFillOptions): void {
    }
    popView(): void {
        this.viewDepth--;
    }
    pushView(portX: number, portY: number, portWidth: number, portHeight: number, viewX: number = 0, viewY: number = 0, viewWidth: number = portWidth, viewHeight: number = portHeight): void {
        this._pushedViews.push({ port: [portX, portY, portWidth, portHeight], view: [viewX, viewY, viewWidth, viewHeight] });
        this.viewDepth++;
    }
    setSize(width: number, height: number): void {
    }
}