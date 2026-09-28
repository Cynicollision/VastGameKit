import { GameError } from './../core';
import { Sprite } from './../resources/sprite';

export type GameCanvasOptions = {
    backgroundColor?: string;
    imageSmoothing?: boolean;
    fullScreen?: boolean;
    height?: number;
    width?: number;
};

export type CanvasDrawImageOptions = {
    opacity?: number;
    repeatHeight?: number;
    repeatWidth?: number;
    repeatX?: boolean;
    repeatY?: boolean;
};

export type CanvasDrawTextOptions = {
    color?: string;
    font?: string;
};

export type CanvasFillOptions = {
    opacity?: number;
}

export interface GameCanvas {
    readonly height: number;
    readonly width: number;
    clear(): void;
    drawCanvas(canvas: GameCanvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void;
    drawRect(color: string, x: number, y: number, w: number, h: number): void;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, options?: CanvasDrawImageOptions): void;
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawImageOptions): void;
    drawText(text: string,x: number, y: number,  options?: CanvasDrawTextOptions): void;
    fill(color: string, width: number, height: number, options?: CanvasFillOptions): void;
    fillArea(color: string, x: number, y: number, width: number, height: number, options?: CanvasFillOptions): void;
    // Until the matching popView, draws within the port rectangle only, with the view rectangle stretched to fill it.
    // The view defaults to the port's size at the origin. Views nest, each relative to the one before.
    popView(): void;
    pushView(portX: number, portY: number, portWidth: number, portHeight: number, viewX?: number, viewY?: number, viewWidth?: number, viewHeight?: number): void;
    setSize(width: number, height: number): void;
}

export class GameCanvasHtml2D implements GameCanvas {
    private static readonly DefaultBackgroundColor: string = '#fff';

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

        if (options.fullScreen) {
            window.addEventListener('resize', () => canvas.setSize(window.innerWidth, window.innerHeight));
        }

        return canvas;
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

        if (options.fullScreen) {
            this.setSize(window.innerWidth, window.innerHeight);
        }
        else if (options.width && options.height) {
            this.setSize(options.width, options.height);
        }
    }

    clear(): void {
        this.canvasContext2D.clearRect(0, 0, this._canvas.width, this._canvas.height);

        if (this.backgroundColor) {
            this.canvasContext2D.fillStyle = this.backgroundColor;
            this.canvasContext2D.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }
    }

    drawRect(color: string, x: number, y: number, w: number, h: number): void {
        this.canvasContext2D.strokeStyle = color;
        this.canvasContext2D.strokeRect(x, y, w, h);
    }

    drawSprite(sprite: Sprite, x: number, y: number, options: CanvasDrawImageOptions = {}): void {
        this.drawImage(sprite.image, 0, 0, sprite.width, sprite.height, x, y, sprite.width, sprite.height, options);
    }

    drawText(text: string, x: number, y: number, options: CanvasDrawTextOptions = {}): void {
        this.canvasContext2D.font = options.font || '16px arial';
        this.canvasContext2D.fillStyle = options.color || '#000';
        this.canvasContext2D.fillText(text, x, y);
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
        let previousOpacity: number | null = null;

        if (options.opacity !== undefined && options.opacity !== 1) {
            previousOpacity = this.canvasContext2D.globalAlpha;
            this.canvasContext2D.globalAlpha = options.opacity;
        }
        
        this.canvasContext2D.beginPath();
        this.canvasContext2D.rect(x, y, width, height);
        this.canvasContext2D.fillStyle = color;
        this.canvasContext2D.fill();

        // reset opacity
        if (previousOpacity !== null) {
            this.canvasContext2D.globalAlpha = previousOpacity;
        }
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
