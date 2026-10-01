// Pixel art drawn as text: each character is a palette color, and '.' (or a space) is transparent. Images are laid out
// as sheets of equally sized frames, the way Sprites and BitmapFonts read them.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { encodePng } from './png.mjs';

// Splits a template string of pixel rows into rows, ignoring blank lines and indentation.
export function pixels(text) {
    return text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
}

function parseColor(hex) {
    const value = parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 255];
}

export class Image {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8Array(width * height * 4);
    }

    // Draws rows of palette characters with their top-left at x, y. Transparent pixels are skipped.
    draw(rows, x, y, palette) {
        rows.forEach((row, rowIndex) => {
            Array.from(row).forEach((character, column) => {
                if (character === '.' || character === ' ') {
                    return;
                }
                const color = palette[character];
                if (!color) {
                    throw new Error(`No palette color for "${character}" in row ${rowIndex}: ${row}`);
                }
                this.setPixel(x + column, y + rowIndex, parseColor(color));
            });
        });
    }

    setPixel(x, y, rgba) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.data.set(rgba, (y * this.width + x) * 4);
    }

    save(path) {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, encodePng(this.width, this.height, this.data));
    }
}

// An image of frames (each an array of rows), `columns` frames per row. With exact, every frame must fill its size, to
// catch miscounted rows.
export function sheet(frames, frameWidth, frameHeight, columns, palette, exact = false) {
    const rows = Math.ceil(frames.length / columns);
    const image = new Image(frameWidth * Math.min(columns, frames.length), frameHeight * rows);

    frames.forEach((frame, index) => {
        if (frame.length > frameHeight || frame.some(row => row.length > frameWidth)) {
            throw new Error(`Frame ${index} is larger than ${frameWidth}x${frameHeight}.`);
        }
        if (exact && (frame.length !== frameHeight || frame.some(row => row.length !== frameWidth))) {
            const row = frame.findIndex(row => row.length !== frameWidth);
            throw new Error(`Frame ${index} isn't ${frameWidth}x${frameHeight}: it has ${frame.length} rows${row >= 0 ? `, and row ${row} is ${frame[row].length} wide` : ''}.`);
        }
        image.draw(frame, (index % columns) * frameWidth, Math.floor(index / columns) * frameHeight, palette);
    });

    return image;
}
