import { GameError } from './../core';
import { BitmapFont } from './../resources/bitmapFont';
import { Sprite } from './../resources/sprite';

// How a canvas is displayed. 'integer' scales it by the largest whole number of screen pixels that fits, so every
// canvas pixel is the same size and stays crisp. 'fit' scales it to fit exactly, which may blur pixel art.
export type CanvasScaleMode = 'integer' | 'fit';

export type GameCanvasOptions = {
    backgroundColor?: string;
    imageSmoothing?: boolean;
    // resizes the canvas to fill the window. Ignored when scale is set.
    fullScreen?: boolean;
    // the canvas size, which defaults to the canvas element's size.
    height?: number;
    width?: number;
    // keeps the canvas size and scales its display to fit its parent element's width and the window's height,
    // centered. Default: not scaled.
    scale?: CanvasScaleMode;
};

export type CanvasDrawImageOptions = {
    opacity?: number;
    // scale and rotation (in degrees, clockwise) apply around the center of the destination. Negative scales flip.
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    repeatHeight?: number;
    repeatWidth?: number;
    repeatX?: boolean;
    repeatY?: boolean;
};

export type CanvasDrawTextOptions = {
    // where x is along the text. Default 'left'.
    align?: CanvasTextAlign;
    // where y is on the text. Default 'alphabetic', the line the letters sit on.
    baseline?: CanvasTextBaseline;
    // a CSS color. Default '#000', or a BitmapFont's own colors.
    color?: string;
    // a CSS font or a BitmapFont. Default '16px arial'.
    font?: string | BitmapFont;
    opacity?: number;
};

export type CanvasFillOptions = {
    opacity?: number;
};

export type CanvasLineOptions = {
    opacity?: number;
    // Default 1.
    width?: number;
};

export interface GameCanvas {
    readonly height: number;
    readonly width: number;
    clear(): void;
    drawCanvas(canvas: GameCanvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void;
    drawCircle(color: string, x: number, y: number, radius: number, options?: CanvasLineOptions): void;
    drawLine(color: string, x1: number, y1: number, x2: number, y2: number, options?: CanvasLineOptions): void;
    drawRect(color: string, x: number, y: number, w: number, h: number, options?: CanvasLineOptions): void;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void;
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawImageOptions): void;
    drawText(text: string,x: number, y: number,  options?: CanvasDrawTextOptions): void;
    fill(color: string, width: number, height: number, options?: CanvasFillOptions): void;
    fillArea(color: string, x: number, y: number, width: number, height: number, options?: CanvasFillOptions): void;
    fillCircle(color: string, x: number, y: number, radius: number, options?: CanvasFillOptions): void;
    // The width text would be drawn at, in pixels.
    measureText(text: string, font?: string | BitmapFont): number;
    // Until the matching popView, draws within the port rectangle only, with the view rectangle stretched to fill it.
    // The view defaults to the port's size at the origin. Views nest, each relative to the one before.
    popView(): void;
    pushView(portX: number, portY: number, portWidth: number, portHeight: number, viewX?: number, viewY?: number, viewWidth?: number, viewHeight?: number): void;
    setSize(width: number, height: number): void;
}

export class GameCanvasHtml2D implements GameCanvas {
    private static readonly DefaultBackgroundColor: string = '#fff';
    private static readonly DefaultFont = '16px arial';

    // Offscreen canvases have no background color and clear to transparent.
    private readonly backgroundColor?: string;
    private readonly imageSmoothing: boolean;

    private _canvas: HTMLCanvasElement;
    get canvas() { return this._canvas; }

    private readonly canvasContext2D: CanvasRenderingContext2D;

    get height() { return this._canvas.height; }
    get width() { return this._canvas.width; }

    static initForElement(canvasElement: HTMLCanvasElement, options: GameCanvasOptions = {}): GameCanvas {
        const canvas = new GameCanvasHtml2D(canvasElement, { ...options, backgroundColor: options.backgroundColor || GameCanvasHtml2D.DefaultBackgroundColor });
        const scale = options.scale;

        if (scale) {
            const updateDisplaySize = (): void => canvas.updateDisplaySize(scale);
            updateDisplaySize();
            window.addEventListener('resize', updateDisplaySize);

            if (canvasElement.parentElement && typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(updateDisplaySize).observe(canvasElement.parentElement);
            }
        }
        else if (options.fullScreen) {
            window.addEventListener('resize', () => canvas.setSize(window.innerWidth, window.innerHeight));
        }

        return canvas;
    }

    // The scale, in CSS pixels, to display a width x height canvas at within the available size.
    static getDisplayScale(mode: CanvasScaleMode, width: number, height: number, availableWidth: number, availableHeight: number, pixelRatio: number = 1): number {
        const fit = Math.min(availableWidth / width, availableHeight / height);

        if (mode === 'integer') {
            // a whole number of device pixels per canvas pixel, unless the canvas has to shrink to fit.
            const devicePixels = Math.floor(fit * pixelRatio + 1e-9);
            if (devicePixels >= 1) {
                return devicePixels / pixelRatio;
            }
        }

        return fit;
    }

    static initNewCanvas(options: GameCanvasOptions = {}): GameCanvas {
        return new GameCanvasHtml2D(document.createElement('canvas'), options);
    }

    private constructor(canvasElement: HTMLCanvasElement, options: GameCanvasOptions) {
        if (!canvasElement) {
            throw new GameError(`Attempted to attach to invalid canvas element.`);
        }

        const context = canvasElement.getContext('2d');
        if (!context) {
            throw new GameError(`Unable to get a 2D rendering context for canvas element.`);
        }

        this._canvas = canvasElement;
        this.canvasContext2D = context;
        this.backgroundColor = options.backgroundColor;
        this.imageSmoothing = options.imageSmoothing !== undefined ? options.imageSmoothing : false;
        this.canvasContext2D.imageSmoothingEnabled = this.imageSmoothing;

        if (options.fullScreen && !options.scale) {
            this.setSize(window.innerWidth, window.innerHeight);
        }
        else if (options.width && options.height) {
            this.setSize(options.width, options.height);
        }
    }

    // Sets the canvas's displayed size to fit its parent element's width and the window's height.
    private updateDisplaySize(mode: CanvasScaleMode): void {
        const canvas = this._canvas;
        const parent = canvas.parentElement;
        let availableWidth = window.innerWidth;

        if (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            availableWidth = Math.min(availableWidth, parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
        }

        const scale = GameCanvasHtml2D.getDisplayScale(mode, canvas.width, canvas.height, availableWidth, window.innerHeight, window.devicePixelRatio || 1);

        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
        canvas.style.imageRendering = this.imageSmoothing ? 'auto' : 'pixelated';
    }

    clear(): void {
        this.canvasContext2D.clearRect(0, 0, this._canvas.width, this._canvas.height);

        if (this.backgroundColor) {
            this.canvasContext2D.fillStyle = this.backgroundColor;
            this.canvasContext2D.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }
    }

    // Draws with a temporary opacity, restoring the previous one afterward.
    private withOpacity(opacity: number | undefined, draw: (context: CanvasRenderingContext2D) => void): void {
        const context = this.canvasContext2D;

        if (opacity === undefined || opacity === 1) {
            draw(context);
            return;
        }

        const previousOpacity = context.globalAlpha;
        context.globalAlpha = previousOpacity * opacity;
        draw(context);
        context.globalAlpha = previousOpacity;
    }

    drawCircle(color: string, x: number, y: number, radius: number, options: CanvasLineOptions = {}): void {
        this.withOpacity(options.opacity, context => {
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.strokeStyle = color;
            context.lineWidth = options.width !== undefined ? options.width : 1;
            context.stroke();
        });
    }

    drawLine(color: string, x1: number, y1: number, x2: number, y2: number, options: CanvasLineOptions = {}): void {
        this.withOpacity(options.opacity, context => {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.strokeStyle = color;
            context.lineWidth = options.width !== undefined ? options.width : 1;
            context.stroke();
        });
    }

    drawRect(color: string, x: number, y: number, w: number, h: number, options: CanvasLineOptions = {}): void {
        this.withOpacity(options.opacity, context => {
            context.strokeStyle = color;
            context.lineWidth = options.width !== undefined ? options.width : 1;
            context.strokeRect(x, y, w, h);
        });
    }

    drawSprite(sprite: Sprite, x: number, y: number, options: CanvasDrawImageOptions = {}): void {
        this.drawImage(sprite.image, 0, 0, sprite.width, sprite.height, x, y, sprite.width, sprite.height, options);
    }

    drawText(text: string, x: number, y: number, options: CanvasDrawTextOptions = {}): void {
        const font = options.font;
        if (font && typeof font !== 'string') {
            this.drawBitmapText(font, text, x, y, options);
            return;
        }

        this.withOpacity(options.opacity, context => {
            context.font = font || GameCanvasHtml2D.DefaultFont;
            context.fillStyle = options.color || '#000';
            context.textAlign = options.align || 'left';
            context.textBaseline = options.baseline || 'alphabetic';
            context.fillText(text, x, y);
        });
    }

    // Draws each line's glyphs on whole pixels, aligned as CSS text would be. The alphabetic baseline is the bottom of
    // the glyphs.
    private drawBitmapText(font: BitmapFont, text: string, x: number, y: number, options: CanvasDrawTextOptions): void {
        const layout = font.layout(text);
        const image = font.getImage(options.color);
        const align = options.align || 'left';
        const baseline = options.baseline || 'alphabetic';
        const top = baseline === 'top' || baseline === 'hanging' ? y : baseline === 'middle' ? y - layout.height / 2 : y - layout.height;

        layout.lines.forEach((line, lineIndex) => {
            const lineWidth = font.measureLine(line);
            const left = align === 'center' ? x - lineWidth / 2 : align === 'right' || align === 'end' ? x - lineWidth : x;
            const lineY = Math.round(top + lineIndex * (font.height + font.lineSpacing));

            line.forEach((character, index) => {
                const source = font.getGlyphImageSourceCoords(character);
                if (source) {
                    const glyphX = Math.round(left + index * (font.width + font.letterSpacing));
                    this.drawImage(image, source[0], source[1], font.width, font.height, glyphX, lineY, font.width, font.height, { opacity: options.opacity });
                }
            });
        });
    }

    measureText(text: string, font?: string | BitmapFont): number {
        if (font && typeof font !== 'string') {
            return font.measureText(text);
        }

        this.canvasContext2D.font = font || GameCanvasHtml2D.DefaultFont;
        return this.canvasContext2D.measureText(text).width;
    }

    drawCanvas(canvas: GameCanvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options: CanvasDrawImageOptions = {}): void {
        if (canvas instanceof GameCanvasHtml2D) {
            const htmlCanvas = <GameCanvasHtml2D>canvas;
            this.drawImage(htmlCanvas.canvas, sx, sy, sw, sh, dx, dy, dw, dh, options);
        }
    }

    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options: CanvasDrawImageOptions = {}): void {
        // set opacity
        const defaultOpacity = 1;
        let previousOpacity: number | null = null;

        if (options.opacity !== defaultOpacity && options.opacity !== null && options.opacity !== undefined) {
            previousOpacity = this.canvasContext2D.globalAlpha;
            this.canvasContext2D.globalAlpha = options.opacity;
        }

        if (options.repeatX || options.repeatY) {
            const repetition = options.repeatX && options.repeatY ? 'repeat' : options.repeatX ? 'repeat-x' : 'repeat-y';
            const pattern = this.canvasContext2D.createPattern(image, repetition);
            if (pattern) {
                this.canvasContext2D.fillStyle = pattern;
                this.canvasContext2D.fillRect(dx, dy, options.repeatWidth || this.width, options.repeatHeight || this.height);
            }
        }
        else if (options.rotation || (options.scaleX !== undefined && options.scaleX !== 1) || (options.scaleY !== undefined && options.scaleY !== 1)) {
            const context = this.canvasContext2D;
            context.save();
            context.translate(dx + dw / 2, dy + dh / 2);
            if (options.rotation) {
                context.rotate(options.rotation * Math.PI / 180);
            }
            context.scale(options.scaleX !== undefined ? options.scaleX : 1, options.scaleY !== undefined ? options.scaleY : 1);
            context.drawImage(image, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
            context.restore();
        }
        else {
            this.canvasContext2D.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        }

        // reset opacity
        if (previousOpacity !== null) {
            this.canvasContext2D.globalAlpha = previousOpacity;
        }
    }

    fill(color: string, width: number, height: number, options: CanvasFillOptions = {}): void {
        this.fillArea(color, 0, 0, width, height, options);
    }

    fillArea(color: string, x: number, y: number, width: number, height: number, options: CanvasFillOptions = {}): void {
        this.withOpacity(options.opacity, context => {
            context.fillStyle = color;
            context.fillRect(x, y, width, height);
        });
    }

    fillCircle(color: string, x: number, y: number, radius: number, options: CanvasFillOptions = {}): void {
        this.withOpacity(options.opacity, context => {
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
        });
    }

    popView(): void {
        this.canvasContext2D.restore();
    }

    pushView(portX: number, portY: number, portWidth: number, portHeight: number, viewX: number = 0, viewY: number = 0, viewWidth: number = portWidth, viewHeight: number = portHeight): void {
        const context = this.canvasContext2D;
        const scaleX = portWidth / viewWidth;
        const scaleY = portHeight / viewHeight;

        context.save();
        context.beginPath();
        context.rect(portX, portY, portWidth, portHeight);
        context.clip();

        // snap the scrolled offset to whole pixels so tiles don't shimmer or show seams as the view moves.
        context.translate(portX - Math.round(viewX * scaleX), portY - Math.round(viewY * scaleY));
        context.scale(scaleX, scaleY);
    }

    setSize(width: number, height: number): void {
        this._canvas.height = height;
        this._canvas.width = width;
        // resizing a canvas resets its context state.
        this.canvasContext2D.imageSmoothingEnabled = this.imageSmoothing;
    }
}
