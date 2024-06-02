import { CanvasDrawImageOptions, CanvasDrawTextOptions, CanvasFillOptions, GameCanvas, GameCanvasOptions } from './../../engine/device/canvas';
import { Sprite } from './../../engine/sprite';

export class MockGameCanvas implements GameCanvas {
    height: number = 800;
    width: number = 600;

    clear(): void {
    }
    drawCanvas(canvas: GameCanvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void {
    }
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void {
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