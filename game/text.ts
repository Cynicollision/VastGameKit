import { BitmapFont, CanvasDrawTextOptions, GameCanvas } from './../engine';
import { Colors } from './constants';

let font: BitmapFont;

export function setFont(value: BitmapFont): void {
    font = value;
}

// Draws text in the pixel font with a drop shadow, so it reads over anything.
export function drawText(canvas: GameCanvas, text: string, x: number, y: number, options: CanvasDrawTextOptions = {}): void {
    const textOptions = { baseline: 'top' as CanvasTextBaseline, ...options, font: font };
    canvas.drawText(text, x + 1, y + 1, { ...textOptions, color: Colors.outline });
    canvas.drawText(text, x, y, { color: Colors.white, ...textOptions });
}
