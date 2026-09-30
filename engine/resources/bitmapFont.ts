import { GameError } from './../core';
import { Sprite } from './sprite';

export type BitmapFontOptions = {
    // an image of equally sized glyphs, left to right and then top to bottom.
    source: string;
    // the size of each glyph in the image.
    width: number;
    height: number;
    // the characters in the image, in the same order as its glyphs.
    characters: string;
    // pixels between glyphs, and between lines. Default 0.
    letterSpacing?: number;
    lineSpacing?: number;
};

// A pixel font drawn from an image of glyphs, for crisp text at any scale. Pass it as the font when drawing text.
export class BitmapFont {
    readonly name: string;
    readonly sprite: Sprite;
    readonly characters: string[];
    readonly letterSpacing: number;
    readonly lineSpacing: number;

    // the glyph image recolored, by color.
    private readonly tintedImages: Map<string, HTMLCanvasElement> = new Map();

    get height() { return this.sprite.height; }
    get width() { return this.sprite.width; }
    get loaded() { return this.sprite.loaded; }

    static new(name: string, options: BitmapFontOptions): BitmapFont {
        if (!options.width || !options.height) {
            throw new GameError(`BitmapFont ${name} must be defined with a glyph width and height.`);
        }

        return new BitmapFont(name, options);
    }

    private constructor(name: string, options: BitmapFontOptions) {
        this.name = name;
        this.sprite = Sprite.new(name, { source: options.source, width: options.width, height: options.height });
        // by code point, so characters outside the Basic Multilingual Plane count as one glyph.
        this.characters = Array.from(options.characters);
        this.letterSpacing = options.letterSpacing || 0;
        this.lineSpacing = options.lineSpacing || 0;
    }

    // The glyph's position in the image, or undefined if the font doesn't have it. Letters the font only has in one
    // case are drawn in that case.
    getGlyphImageSourceCoords(character: string): [number, number] | undefined {
        let index = this.characters.indexOf(character);

        if (index < 0) {
            index = this.characters.indexOf(character.toUpperCase());
        }
        if (index < 0) {
            index = this.characters.indexOf(character.toLowerCase());
        }

        return index >= 0 ? this.sprite.getFrameImageSourceCoords(index) : undefined;
    }

    // The glyph image recolored, keeping its transparency. Without a color, the image as drawn.
    getImage(color?: string): CanvasImageSource {
        if (!color) {
            return this.sprite.image;
        }

        let tinted = this.tintedImages.get(color);
        if (!tinted) {
            tinted = document.createElement('canvas');
            tinted.width = this.sprite.image.width;
            tinted.height = this.sprite.image.height;

            const context = tinted.getContext('2d')!;
            context.drawImage(this.sprite.image, 0, 0);
            context.globalCompositeOperation = 'source-in';
            context.fillStyle = color;
            context.fillRect(0, 0, tinted.width, tinted.height);
            this.tintedImages.set(color, tinted);
        }

        return tinted;
    }

    // Where each line starts, relative to where the text is drawn, and the size of the block of text.
    layout(text: string): { lines: string[][], width: number, height: number } {
        const lines = text.split('\n').map(line => Array.from(line));
        const lineWidths = lines.map(line => this.measureLine(line));

        return {
            lines: lines,
            width: Math.max(...lineWidths),
            height: lines.length * this.height + (lines.length - 1) * this.lineSpacing,
        };
    }

    load(): Promise<void | string> {
        return this.sprite.loadImage();
    }

    // The width of the widest line.
    measureText(text: string): number {
        return this.layout(text).width;
    }

    measureLine(characters: string[]): number {
        return characters.length > 0 ? characters.length * (this.width + this.letterSpacing) - this.letterSpacing : 0;
    }
}
