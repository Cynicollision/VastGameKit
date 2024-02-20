import { Sprite } from './../../engine/sprite';
import { CanvasDrawImageOptions, GameCanvas } from './../../engine/device';
import { CanvasDrawTextOptions, CanvasFillOptions } from './../../engine/device/canvas';

export class MockGameCanvas implements GameCanvas {
    height: number = 800;
    width: number = 600;

    clear(): void {
    }
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawImageOptions): void {
    }
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawImageOptions): void {
    }
    drawText(text: string, x: number, y: number, options?: CanvasDrawTextOptions): void {
    }
    fill(color: string, width: number, height: number, options?: CanvasFillOptions): void {
    }
    fillArea(color: string, x: number, y: number, width: number, height: number, options?: CanvasFillOptions): void {
    }
    setOrigin(x: number, y: number): void {
    }
}