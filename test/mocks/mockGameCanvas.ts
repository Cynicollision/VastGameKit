import { CanvasDrawImageOptions, CanvasDrawTextOptions, CanvasFillOptions, GameCanvas, GameCanvasOptions } from './../../engine/device/canvas';
import { Sprite } from './../../engine/sprite';


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

export class MockGameCanvas implements GameCanvas {
    height: number = 800;
    width: number = 600;

    private _drawnImages: DrawnImage[] = [];
    get drawnImages() { return this._drawnImages; }
    
    // GameCanvas implementation
    clear(): void {
        this._drawnImages = [];
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
    subCanvas(name: string, _options: GameCanvasOptions): GameCanvas {
        return new MockGameCanvas();
    }
}