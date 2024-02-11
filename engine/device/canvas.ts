export interface GameCanvasOptions {
    backgroundColor?: string;
    fullScreen?: boolean;
    height?: number;
    width?: number;
}

export interface CanvasDrawOptions {
    opacity?: number;
    tileX?: boolean;
    tileY?: boolean;
}

export interface GameCanvas {
    clear(): void;
    fill(width: number, height: number, color: string): void;
    fillArea(x: number, y: number, width: number, height: number, color: string): void;
    drawImage(image: CanvasImageSource, srcX: number, srcY: number, destX: number, destY: number, width: number, height: number, options: CanvasDrawOptions): void;
}

export class GameCanvasHtml2D implements GameCanvas {
    private backgroundColor: string = '#fff';
    private canvas: HTMLCanvasElement;
    private origin: [number, number] = [0, 0];

    private get canvasContext2D(): CanvasRenderingContext2D {
        return this.canvas.getContext('2d');
    }

    static defineForHtmlCanvasElement(elementId: string): GameCanvas {
        const gc = new GameCanvasHtml2D();
        gc.canvas = <HTMLCanvasElement>document.getElementById(elementId);

        if (!gc.canvas) {
            throw new Error(`Attempted to attach to invalid canvas element ID: ${elementId}.`);
        }

        return gc;
    }

    private constructor() {}

    

    clear(): void {
        this.canvasContext2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.fillArea(0, 0, this.canvas.width, this.canvas.height, this.backgroundColor);
    }

    fill(width: number, height: number, color: string): void {
        const [x, y] = this.origin;
        this.fillArea(x, y, width, height, color);
    }

    fillArea(x: number, y: number, width: number, height: number, color: string): void {
        this.canvasContext2D.beginPath();
        this.canvasContext2D.rect(x, y, width, height);
        this.canvasContext2D.fillStyle = color;
        this.canvasContext2D.fill();
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

        if (options.tileX || options.tileY) {
            const repetition = options.tileX && options.tileY ? 'repeat' : options.tileX ? 'repeat-x' : 'repeat-y';
            const pattern = this.canvasContext2D.createPattern(image, repetition);
            this.canvasContext2D.fillStyle = pattern;
            this.canvasContext2D.fillRect(originX + destX, originY + destY, this.canvasContext2D.canvas.width, this.canvasContext2D.canvas.height);
        }
        else {
            this.canvasContext2D.drawImage(image, srcX, srcY, width, height, Math.floor(originX + destX), Math.floor(originY + destY), width, height);
        }

        // reset opacity
        if (previousOpacity !== null) {
            this.canvasContext2D.globalAlpha = previousOpacity;
        }
    }
}
