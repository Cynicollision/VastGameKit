import { GameError, ObjMap } from './../core';
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
    setSize(width: number, height: number): void;
    subCanvas(name: string, options?: GameCanvasOptions): GameCanvas;
}

export class GameCanvasHtml2D implements GameCanvas {
    private static readonly DefaultBackgroundColor: string = '#fff';

    private backgroundColor: string;
    private subCanvasMap: ObjMap<GameCanvas> = {};

    private _canvas: HTMLCanvasElement;
    get canvas() { return this._canvas; }

    private get canvasContext2D(): CanvasRenderingContext2D {
        return this._canvas.getContext('2d');
    }

    get height() { return this._canvas.height; }
    get width() { return this._canvas.width; }

    static initForElement(canvasElement: HTMLCanvasElement, options: GameCanvasOptions = {}): GameCanvas {
        const canvas = new GameCanvasHtml2D(canvasElement, options);

        if (options.fullScreen) {
            window.onresize = function(this: GlobalEventHandlers, ev: UIEvent): void {
                canvas.setSize(window.innerWidth, window.innerHeight);
            };
        }
        
        return canvas;
    }

    static initNewCanvas(options: GameCanvasOptions = {}): GameCanvas {
        return this.initForElement(document.createElement('canvas'), options);
    }

    private constructor(canvasElement: HTMLCanvasElement, options: GameCanvasOptions) {
        if (!canvasElement) {
            throw new GameError(`Attempted to attach to invalid canvas element.`);
        }

        this._canvas = canvasElement;

        if (options.fullScreen) {
            this.setSize(window.innerWidth, window.innerHeight);
        }
        else if (options.width && options.height) {
            this.setSize(options.width, options.height);
        }

        this.backgroundColor = options.backgroundColor || GameCanvasHtml2D.DefaultBackgroundColor;
        this.canvasContext2D.imageSmoothingEnabled = options.imageSmoothing !== undefined ? options.imageSmoothing : false;
    }

    clear(): void {
        this.canvasContext2D.rect(0, 0, this._canvas.width, this._canvas.height);
        this.canvasContext2D.fillStyle = this.backgroundColor;
        this.canvasContext2D.fill();
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
        let previousOpacity: number = null;

        if (options.opacity !== defaultOpacity && options.opacity !== null && options.opacity !== undefined) {
            previousOpacity = this.canvasContext2D.globalAlpha;
            this.canvasContext2D.globalAlpha = options.opacity;
        }

        if (options.repeatX || options.repeatY) {
            const repetition = options.repeatX && options.repeatY ? 'repeat' : options.repeatX ? 'repeat-x' : 'repeat-y';
            const pattern = this.canvasContext2D.createPattern(image, repetition);
            this.canvasContext2D.fillStyle = pattern;
            this.canvasContext2D.fillRect( dx, dy, options.repeatWidth || this.width, options.repeatHeight || this.height);
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
        let previousOpacity: number = null;

        if (options.opacity && options.opacity !== 1) {
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

    setSize(width: number, height: number): void {
        this._canvas.height = height;
        this._canvas.width = width;
    }

    subCanvas(name: string, options: GameCanvasOptions = {}): GameCanvas {
        if (this.subCanvasMap[name]) {
            return this.subCanvasMap[name];
        }
        
        const subCanvas = GameCanvasHtml2D.initNewCanvas(options);
        this.subCanvasMap[name] = subCanvas;

        return subCanvas;
    }
}
