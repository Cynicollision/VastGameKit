import { CanvasDrawImageOptions, CanvasFillOptions, GameCanvas } from './../device/canvas';
import { Sprite } from './../sprite/sprite';
import { SceneDefinition } from './scene';

export type BackgroundOptions = CanvasDrawImageOptions | CanvasFillOptions;

export class Background {
    private static readonly DefaultColor = '#CCC';
    private readonly scene: SceneDefinition;
    private readonly options: BackgroundOptions;
    readonly color: string;
    readonly sprite: Sprite;

    private constructor(scene: SceneDefinition, color: string, sprite: Sprite, options: BackgroundOptions) {
        this.color = color;
        this.scene = scene; // TODO replace scene reference and params? does Background just need height/width and x,y ?
        this.sprite = sprite;
        this.options = options;
    }

    static fromColor(scene: SceneDefinition, color: string, options: CanvasFillOptions = {}): Background {
        return new Background(scene, color, null, options);
    }

    static fromSprite(scene: SceneDefinition, sprite: Sprite, options: CanvasDrawImageOptions): Background {
        options.repeatX = options.repeatX !== undefined ? options.repeatX : true;
        options.repeatY = options.repeatY !== undefined ? options.repeatY : true;
        options.repeatHeight = options.repeatHeight || scene.height;
        options.repeatWidth = options.repeatWidth || scene.width;
        
        return new Background(scene, Background.DefaultColor, sprite, options);
    }

    draw(canvas: GameCanvas): void {
        if (this.sprite) {
            canvas.drawSprite(this.sprite, 0, 0, this.options); // TODO use x,y here if implemented
        }
        else if (this.color) {
            canvas.fillArea(this.color, 0, 0, this.scene.width, this.scene.height, this.options); // TODO use x,y here if implemented
        }
    }
}