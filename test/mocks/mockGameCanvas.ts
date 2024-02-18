import { Sprite } from './../../engine/sprite';
import { CanvasDrawOptions, GameCanvas } from './../../engine/device';
import { CanvasDrawTextOptions } from './../../engine/device/canvas';

export class MockGameCanvas implements GameCanvas {
    height: number = 800;
    width: number = 600;

    clear(): void {
    }
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawOptions): void {
    }
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawOptions): void {
    }
    drawText(text: string, x: number, y: number, options?: CanvasDrawTextOptions): void {
    }
    fill(color: string, width: number, height: number): void {
    }
    fillArea(color: string, x: number, y: number, width: number, height: number): void {
    }
    setOrigin(x: number, y: number): void {
    }
}