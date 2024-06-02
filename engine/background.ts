import { CanvasDrawImageOptions, CanvasFillOptions, GameCanvas } from './device/canvas';
import { Sprite } from './sprite';

export type BackgroundOptions = {
    height?: number;
    width?: number;
    x?: number;
    y?: number;
};

export type BackgroundDrawOptions = CanvasDrawImageOptions | CanvasFillOptions;

export class Background {
    private static readonly DefaultColor = '#CCC';

    private readonly _drawOptions: BackgroundDrawOptions;
    readonly color: string;
    readonly sprite: Sprite;
    readonly height: number = 0;
    readonly width: number = 0;
    readonly x: number = 0;
    readonly y: number = 0;

    private constructor(color: string, sprite: Sprite, options: BackgroundOptions = {}, drawOptions: BackgroundDrawOptions = {}) {
        this.color = color;
        this.sprite = sprite;
        
        this.height = options.height || 0;
        this.width = options.width || 0;
        this.x = options.x || 0;
        this.y = options.y || 0;

        this._drawOptions = drawOptions;
    }

    static fromColor( color: string, options: BackgroundOptions = {}, drawOptions: CanvasFillOptions = {}): Background {
        return new Background(color, null, options, drawOptions);
    }

    static fromSprite(sprite: Sprite, options: BackgroundOptions = {}, drawOptions: CanvasDrawImageOptions = {}): Background {
        drawOptions.repeatX = drawOptions.repeatX !== undefined ? drawOptions.repeatX : true;
        drawOptions.repeatY = drawOptions.repeatY !== undefined ? drawOptions.repeatY : true;
        drawOptions.repeatHeight = drawOptions.repeatHeight || options.height;
        drawOptions.repeatWidth = drawOptions.repeatWidth || options.width;
        
        return new Background(Background.DefaultColor, sprite, options, drawOptions);
    }

    draw(canvas: GameCanvas): void {
        if (this.sprite) {
            canvas.drawSprite(this.sprite, this.x, this.y, this._drawOptions);
        }
        else if (this.color) {
            canvas.fillArea(this.color, this.x, this.y, this.width, this.height, this._drawOptions);
        }
    }
}