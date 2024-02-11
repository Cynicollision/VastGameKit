import { CanvasDrawOptions, GameCanvas } from './../../engine/device';

export class MockGameCanvas implements GameCanvas {
    clear(): void {
    }
    fill(width: number, height: number, color: string): void {
    }
    fillArea(x: number, y: number, width: number, height: number, color: string): void {
    }
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawOptions): void {
    }
}