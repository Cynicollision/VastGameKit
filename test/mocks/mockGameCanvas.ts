import { Sprite } from './../../engine/sprite';
import { CanvasDrawOptions, GameCanvas } from './../../engine/device';

export class MockGameCanvas implements GameCanvas {
    origin: [number, number];
    height: number;
    width: number;
    clear(): void {
    }
    fill(width: number, height: number, color: string): void {
    }
    fillArea(x: number, y: number, width: number, height: number, color: string): void {
    }
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawOptions): void {
    }
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawOptions): void {
    }
}