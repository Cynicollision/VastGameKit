import { GameCanvasHtml2D } from './../engine/device/canvas';
import { BitmapFont } from './../engine/resources/bitmapFont';
import { GameConstruction } from './../engine/structure/construction';

// a font of 2x2 glyphs in a 3x2 grid: 'A' is solid white, 'B' only its left column, and 'C' blank. 'd' and 'E' are on
// the second row.
function createFontSource(): string {
    const image = document.createElement('canvas');
    image.width = 6;
    image.height = 4;
    const context = image.getContext('2d')!;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 2, 2);
    context.fillRect(2, 0, 1, 2);
    context.fillRect(0, 2, 4, 2);
    return image.toDataURL();
}

function getPixel(canvas: GameCanvasHtml2D, x: number, y: number): number[] {
    return Array.from(canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
}

// which pixels in a row of the canvas are drawn, as a string of # and .
function getRow(canvas: GameCanvasHtml2D, y: number): string {
    const data = canvas.canvas.getContext('2d')!.getImageData(0, y, canvas.width, 1).data;
    let row = '';
    for (let x = 0; x < canvas.width; x++) {
        row += data[x * 4 + 3] > 0 ? '#' : '.';
    }
    return row;
}

describe('BitmapFont', () => {
    let font: BitmapFont;

    beforeEach(async () => {
        font = BitmapFont.new('testFont', { source: createFontSource(), width: 2, height: 2, characters: 'ABCdE' });
        await font.load();
    });

    it('requires a glyph size', () => {
        expect(() => BitmapFont.new('testFont', { source: createFontSource(), width: 0, height: 2, characters: 'A' })).toThrow();
    });

    it('is loaded once its image loads', async () => {
        const unloaded = BitmapFont.new('unloaded', { source: createFontSource(), width: 2, height: 2, characters: 'A' });
        expect(unloaded.loaded).toBeFalse();

        await unloaded.load();

        expect(unloaded.loaded).toBeTrue();
    });

    it('finds glyphs in the image by character', () => {
        expect(font.getGlyphImageSourceCoords('A')).toEqual([0, 0]);
        expect(font.getGlyphImageSourceCoords('C')).toEqual([4, 0]);
        expect(font.getGlyphImageSourceCoords('d')).toEqual([0, 2]);
    });

    it('finds glyphs for letters the font only has in the other case', () => {
        expect(font.getGlyphImageSourceCoords('a')).toEqual([0, 0]);
        expect(font.getGlyphImageSourceCoords('D')).toEqual([0, 2]);
    });

    it('has no glyph for characters it does not have', () => {
        expect(font.getGlyphImageSourceCoords('Z')).toBeUndefined();
        expect(font.getGlyphImageSourceCoords(' ')).toBeUndefined();
    });

    it('counts characters outside the Basic Multilingual Plane as one glyph', () => {
        const emojiFont = BitmapFont.new('emojiFont', { source: createFontSource(), width: 2, height: 2, characters: 'A\u{1F431}B' });

        expect(emojiFont.getGlyphImageSourceCoords('B')).toEqual([4, 0]);
        expect(emojiFont.measureText('\u{1F431}')).toBe(2);
    });

    it('measures the widest line, with spacing between glyphs and lines', () => {
        const spaced = BitmapFont.new('spaced', { source: createFontSource(), width: 2, height: 2, characters: 'AB', letterSpacing: 1, lineSpacing: 3 });

        expect(spaced.measureText('')).toBe(0);
        expect(spaced.measureText('AB')).toBe(5);
        expect(spaced.layout('A\nABA')).toEqual({ lines: [['A'], ['A', 'B', 'A']], width: 8, height: 7 });
    });
});

describe('BitmapFont text on a canvas', () => {
    let canvas: GameCanvasHtml2D;
    let font: BitmapFont;

    beforeEach(async () => {
        canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 10, height: 10 });
        font = BitmapFont.new('testFont', { source: createFontSource(), width: 2, height: 2, characters: 'ABCdE', letterSpacing: 1, lineSpacing: 1 });
        await font.load();
    });

    it('draws glyphs from the top-left with a top baseline', () => {
        // a space is blank, the width of a glyph.
        canvas.drawText('A B', 1, 1, { font: font, baseline: 'top' });

        expect(getRow(canvas, 0)).toBe('..........');
        expect(getRow(canvas, 1)).toBe('.##....#..');
        expect(getRow(canvas, 2)).toBe('.##....#..');
        expect(getRow(canvas, 3)).toBe('..........');
    });

    it('draws with the bottom of the glyphs on an alphabetic baseline, by default', () => {
        canvas.drawText('A', 0, 4, { font: font });

        expect(getRow(canvas, 1)).toBe('..........');
        expect(getRow(canvas, 2)).toBe('##........');
        expect(getRow(canvas, 3)).toBe('##........');
        expect(getRow(canvas, 4)).toBe('..........');
    });

    it('centers text vertically on a middle baseline', () => {
        canvas.drawText('A\nA', 0, 5, { font: font, baseline: 'middle' });

        // 5 pixels tall, from y = 2.5, drawn on whole pixels.
        expect(getRow(canvas, 2)).toBe('..........');
        expect(getRow(canvas, 3)).toBe('##........');
        expect(getRow(canvas, 5)).toBe('..........');
        expect(getRow(canvas, 6)).toBe('##........');
        expect(getRow(canvas, 8)).toBe('..........');
    });

    it('aligns each line to the position', () => {
        canvas.drawText('A\nAA', 10, 0, { font: font, align: 'right', baseline: 'top' });
        canvas.drawText('A', 5, 6, { font: font, align: 'center', baseline: 'top' });

        expect(getRow(canvas, 0)).toBe('........##');
        expect(getRow(canvas, 3)).toBe('.....##.##');
        expect(getRow(canvas, 6)).toBe('....##....');
    });

    it('recolors glyphs, keeping their transparency', () => {
        canvas.drawText('B', 0, 0, { font: font, baseline: 'top', color: '#f00' });
        canvas.drawText('B', 4, 0, { font: font, baseline: 'top' });

        expect(getPixel(canvas, 0, 0)).toEqual([255, 0, 0, 255]);
        expect(getPixel(canvas, 1, 0)).toEqual([0, 0, 0, 0]);
        expect(getPixel(canvas, 4, 0)).toEqual([255, 255, 255, 255]);
    });

    it('draws with an opacity', () => {
        canvas.drawText('A', 0, 0, { font: font, baseline: 'top', opacity: 0.5 });

        expect(getPixel(canvas, 0, 0)[3]).toBeCloseTo(128, -1);
    });

    it('measures text in the font', () => {
        expect(canvas.measureText('AAA', font)).toBe(8);
    });
});

describe('BitmapFont construction', () => {
    it('defines, gets, and loads BitmapFonts', async () => {
        const construction = new GameConstruction();
        const font = construction.fonts.add('fntTest', { source: createFontSource(), width: 2, height: 2, characters: 'A' });

        expect(construction.fonts.get('fntTest')).toBe(font);
        expect(() => construction.fonts.add('fntNoOptions')).toThrow();

        await construction.load();

        expect(font.loaded).toBeTrue();
    });
});
