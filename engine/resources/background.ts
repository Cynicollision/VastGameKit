import { CanvasDrawImageOptions, CanvasFillOptions, GameCanvas, GameCanvasHtml2D, GameCanvasOptions } from './../device/canvas';
import { Sprite } from './sprite';
import { TileMap } from './tilemap';

export type BackgroundOptions = {
    color: string,
    height: number;
    width: number;
    x?: number;
    y?: number;
};

export type BackgroundDrawOptions = CanvasDrawImageOptions | CanvasFillOptions;

export class Background {
    private static readonly DefaultColor = '#CCC';

    private readonly height: number = 0;
    private readonly width: number = 0;
    private readonly x: number = 0;
    private readonly y: number = 0;

    private readonly backgroundCanvas: GameCanvas;

    private constructor(options: BackgroundOptions) {
        this.height = options.height;
        this.width = options.width;
        this.x = options.x || 0;
        this.y = options.y || 0;

        const canvasOptions: GameCanvasOptions = {
            backgroundColor: options.color,
            height: this.height,
            width: this.width
        };

        this.backgroundCanvas = GameCanvasHtml2D.initNewCanvas(canvasOptions);
    }

    static createDefaultBackground(width: number, height: number): Background {
        return new Background({ color: Background.DefaultColor, width: width, height: height });
    }

    setFromColor(color: string, drawOptions: CanvasFillOptions = {}): void {
        this.backgroundCanvas.fillArea(color, this.x, this.y, this.width, this.height, drawOptions);
    }

    setFromSprite(sprite: Sprite, drawOptions: CanvasDrawImageOptions = {}): void {
        drawOptions.repeatX = drawOptions.repeatX !== undefined ? drawOptions.repeatX : true;
        drawOptions.repeatY = drawOptions.repeatY !== undefined ? drawOptions.repeatY : true;
        drawOptions.repeatHeight = drawOptions.repeatHeight || this.height;
        drawOptions.repeatWidth = drawOptions.repeatWidth || this.width;
        
        this.backgroundCanvas.drawSprite(sprite, this.x, this.y, drawOptions);
    }

    // TODO
    setFromTileComposition(composition: TileMap, width: number, height: number, drawOptions: CanvasDrawImageOptions = {}): void {
        let animationFrame = 0; // TODO loop through composition.layers, frames
        const [srcX, srcY] = composition.sprite.getFrameImageSourceCoords(animationFrame);

        // TODO x, y = current i/j * tile size ?
        //this.backgroundCanvas.drawImage...
    }

    draw(canvas: GameCanvas): void {
        if (this.width > 0 && this.height > 0) {
            canvas.drawCanvas(this.backgroundCanvas, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
    }
}