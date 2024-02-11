import { Sprite } from './../sprite';

export interface GameCanvasOptions {
    backgroundColor?: string;
    fullScreen?: boolean;
    height?: number;
    width?: number;
}

export interface CanvasDrawOptions {
    opacity?: number;
    repeatHeight?: number;
    repeatWidth?: number;
    repeatX?: boolean;
    repeatY?: boolean;
}

export interface GameCanvas {
    height: number;
    width: number;

    clear(): void;
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options?: CanvasDrawOptions): void;
    drawSprite(sprite: Sprite, x: number, y: number, options?: CanvasDrawOptions): void;
    fill(width: number, height: number, color: string): void;
    fillArea(x: number, y: number, width: number, height: number, color: string): void;
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

    static defineForHtmlCanvasElement(elementId: string, options: GameCanvasOptions = {}): GameCanvas {
        const gc = new GameCanvasHtml2D();
        gc.canvas = <HTMLCanvasElement>document.getElementById(elementId);

        if (options.height) {
            gc.canvas.height = options.height;
        }
        if (options.width) {
            gc.canvas.width = options.width;
        }

        if (!gc.canvas) {
            throw new Error(`Attempted to attach to invalid canvas element ID: ${elementId}.`);
        }

        return gc;
    }

    private constructor() {}

    clear(): void {
        this.canvasContext2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.canvasContext2D.rect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasContext2D.fillStyle = this.backgroundColor;
        this.canvasContext2D.fill();
    }

    drawSprite(sprite: Sprite, x: number, y: number, options: CanvasDrawOptions = {}): void {
        this.drawImage(sprite.image, 0, 0, x, y, sprite.width, sprite.height, options);
    }

    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawOptions = {}): void {
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

    fill(width: number, height: number, color: string): void {
        const [x, y] = this.origin;
        this.fillArea(x, y, width, height, color);
    }

    fillArea(x: number, y: number, width: number, height: number, color: string): void {
        const [originX, originY] = this.origin;

        this.canvasContext2D.beginPath();
        this.canvasContext2D.rect(x + originX, y + originY, width, height);
        this.canvasContext2D.fillStyle = color;
        this.canvasContext2D.fill();
    }

    setOrigin(x: number, y: number): void {
        this.origin = [x, y];
    }
}
