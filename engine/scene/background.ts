import { CanvasDrawImageOptions, CanvasFillOptions, GameCanvas } from './../device/canvas';
import { Layer } from './layer';
import { Sprite } from './../sprite/sprite';

export type BackgroundOptions = CanvasDrawImageOptions | CanvasFillOptions;

export class Background {
    private static readonly DefaultColor = '#CCC';
    private readonly layer: Layer;
    private readonly options: BackgroundOptions;
    readonly color: string;
    readonly sprite: Sprite;

    private constructor(layer: Layer, color: string, sprite: Sprite, options: BackgroundOptions) {
        this.color = color;
        this.layer = layer;
        this.sprite = sprite;
        this.options = options;
    }

    static fromColor(layer: Layer, color: string, options: CanvasFillOptions = {}): Background {
        return new Background(layer, color, null, options);
    }

    static fromSprite(layer: Layer, sprite: Sprite, options: CanvasDrawImageOptions): Background {
        options.repeatX = options.repeatX !== undefined ? options.repeatX : true;
        options.repeatY = options.repeatY !== undefined ? options.repeatY : true;
        options.repeatHeight = options.repeatHeight || layer.height;
        options.repeatWidth = options.repeatWidth || layer.width;
        
        return new Background(layer, Background.DefaultColor, sprite, options);
    }

    draw(canvas: GameCanvas): void {
        if (this.sprite) {
            canvas.drawSprite(this.sprite, this.layer.x, this.layer.y, this.options);
        }
        else if (this.color) {
            canvas.fillArea(this.color, this.layer.x, this.layer.y, this.layer.width, this.layer.height, this.options);
        }
    }
}