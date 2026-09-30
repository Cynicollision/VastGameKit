// The title logo: lines of text in the pixel font, scaled up, with a two-tone fill, an outline, and a shadow.
import { FontCellSize, Glyphs } from './font.mjs';

const Lines = ['NINE', 'LIVES'];
const Scale = 3;
const LineGap = 2 * Scale;
const Border = 2;

export function logo() {
    const glyphHeight = (FontCellSize - 1) * Scale;
    const lineWidths = Lines.map(line => line.length * FontCellSize * Scale - Scale);
    const width = Math.max(...lineWidths) + Border * 2;
    const height = Lines.length * glyphHeight + (Lines.length - 1) * LineGap + Border * 2;

    // which pixels the letters cover, and where each is within its line (for the two-tone fill).
    const filled = Array.from({ length: height }, () => new Array(width).fill(undefined));
    Lines.forEach((line, lineIndex) => {
        const left = Border + Math.floor((width - Border * 2 - lineWidths[lineIndex]) / 2);
        const top = Border + lineIndex * (glyphHeight + LineGap);

        Array.from(line).forEach((character, index) => {
            Glyphs[character].forEach((row, glyphY) => {
                Array.from(row).forEach((pixel, glyphX) => {
                    if (pixel !== '#') {
                        return;
                    }
                    for (let y = 0; y < Scale; y++) {
                        for (let x = 0; x < Scale; x++) {
                            filled[top + glyphY * Scale + y][left + (index * FontCellSize + glyphX) * Scale + x] = glyphY * Scale + y;
                        }
                    }
                });
            });
        });
    });

    const isFilled = (x, y) => y >= 0 && y < height && x >= 0 && x < width && filled[y][x] !== undefined;
    const rows = [];
    for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
            const depth = filled[y][x];
            if (depth !== undefined) {
                // yellow on top, orange below, with a highlight along the top of each letter.
                row += !isFilled(x, y - 1) ? 'w' : depth < glyphHeight / 2 ? 'y' : depth < glyphHeight - Scale ? 'o' : 'O';
            }
            else if (isFilled(x - 1, y - 1) || isFilled(x - 2, y - 2)) {
                row += 'R';
            }
            else {
                let outline = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        outline = outline || isFilled(x + dx, y + dy);
                    }
                }
                row += outline ? 'k' : '.';
            }
        }
        rows.push(row);
    }

    return { width: width, height: height, rows: rows };
}
