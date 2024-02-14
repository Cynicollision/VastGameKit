import { Sprite } from './../sprite';

export type GameCanvasOptions = {
    backgroundColor?: string;
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
    // TODO font? etc.
};

export type CanvasFillOptions = {
    opacity?: number;
}

export interface GameCanvas {
    height: number;
    width: number;
    clear(): void;
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options?: CanvasDrawImageOptions): void;
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawImageOptions): void;
    drawText(text: string,x: number, y: number,  options?: CanvasDrawTextOptions): void;
    fill(color: string, width: number, height: number, options?: CanvasFillOptions): void;
    fillArea(color: string, x: number, y: number, width: number, height: number, options?: CanvasFillOptions): void;
    setOrigin(x: number, y: number): void;
}

export class GameCanvasHtml2D implements GameCanvas {
    private backgroundColor: string = '#fff';
    private canvas: HTMLCanvasElement;
    private origin: [number, number] = [0, 0];

    private get canvasContext2D(): CanvasRenderingContext2D {
        return this.canvas.getContext('2d');
    }

    get height() { return this.canvas.height; }
    get width() { return this.canvas.width; }

    static initForElement(canvas: HTMLCanvasElement, options: GameCanvasOptions = {}): GameCanvas {
        const gameCanvas = new GameCanvasHtml2D();
        gameCanvas.canvas = canvas;

        if (!gameCanvas.canvas) {
            throw new Error(`Attempted to attach to invalid canvas element.`);
        }

        gameCanvas.canvas.height = options.height || gameCanvas.canvas.height;
        gameCanvas.canvas.width = options.width || gameCanvas.canvas.width;

        return gameCanvas;
    }

    private constructor() {}

    setOrigin(x: number, y: number): void {
        this.origin = [x, y];
    }

    clear(): void {
        this.canvasContext2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.canvasContext2D.rect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext2D.fillStyle = this.backgroundColor;
        this.canvasContext2D.fill();
    }

    drawSprite(sprite: Sprite, x: number, y: number, options: CanvasDrawImageOptions = {}): void {
        this.drawImage(sprite.image, 0, 0, x, y, sprite.width, sprite.height, options);
    }

    drawText(text: string, x: number, y: number, options: CanvasDrawTextOptions = {}): void {
        // TODO
    }

    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawImageOptions = {}): void {
        // set opacity
        const defaultOpacity = 1;
        let previousOpacity: number = null;

        if (options.opacity !== defaultOpacity && options.opacity !== null && options.opacity !== undefined) {
            previousOpacity = this.canvasContext2D.globalAlpha;
            this.canvasContext2D.globalAlpha = options.opacity;
        }

        // draw the image relative to the origin
        const [originX, originY] = this.origin;

        if (options.repeatX || options.repeatY) {
            const repetition = options.repeatX && options.repeatY ? 'repeat' : options.repeatX ? 'repeat-x' : 'repeat-y';
            const pattern = this.canvasContext2D.createPattern(image, repetition);
            this.canvasContext2D.fillStyle = pattern;
            this.canvasContext2D.translate(originX, originY);
            this.canvasContext2D.fillRect( destX, destY, options.repeatWidth || this.width, options.repeatHeight || this.height);
            this.canvasContext2D.translate(-originX, -originY)
        }
        else {
            this.canvasContext2D.drawImage(image, srcX, srcY, width, height, Math.floor(originX + destX), Math.floor(originY + destY), width, height);
        }

        // reset opacity
        if (previousOpacity !== null) {
            this.canvasContext2D.globalAlpha = previousOpacity;
        }
    }

    fill(color: string, width: number, height: number, options: CanvasFillOptions = {}): void {
        const [x, y] = this.origin;
        this.fillArea(color, x, y, width, height, options);
    }

    fillArea(color: string, x: number, y: number, width: number, height: number, options: CanvasFillOptions = {}): void {
        const [originX, originY] = this.origin;
        let previousOpacity: number = null;

        if (options.opacity && options.opacity !== 1) {
            previousOpacity = this.canvasContext2D.globalAlpha;
            this.canvasContext2D.globalAlpha = options.opacity;
        }
        
        this.canvasContext2D.beginPath();
        this.canvasContext2D.rect(x + originX, y + originY, width, height);
        this.canvasContext2D.fillStyle = color;
        this.canvasContext2D.fill();

        // reset opacity
        if (previousOpacity !== null) {
            this.canvasContext2D.globalAlpha = previousOpacity;
        }
    }
}
