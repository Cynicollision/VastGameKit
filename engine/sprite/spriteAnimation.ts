import { CanvasDrawOptions, GameCanvas } from './../device';
import { Sprite, SpriteTransformation } from './sprite';

export type SpriteDrawOptions = CanvasDrawOptions & {
    frame?: number;
};

export class SpriteAnimation {
    private readonly sprite: Sprite;
    private transformations: { [index: number]: SpriteTransformation } = {};
    private timer: NodeJS.Timeout;

    private _paused: boolean = true;
    get stopped(): boolean {
        return this._paused;
    }

    static forSprite(sprite: Sprite): SpriteAnimation {
        const animation: SpriteAnimation = new SpriteAnimation(sprite);

        animation.setTransform(SpriteTransformation.Frame, 0);
        animation.setTransform(SpriteTransformation.Opacity, 1);

        return animation;
    }

    private constructor(sprite: Sprite) {
        this.sprite = sprite;
    }

    start(start: number, end: number, delay?: number): void {
        this.stop();
        this.setTransform(SpriteTransformation.Frame, start);

        this._paused = false;
        this.timer = setInterval(() => {
            if (this.getTransform(SpriteTransformation.Frame) === end) {
                this.setTransform(SpriteTransformation.Frame, start);
                // TODO: onAnimationEnd: ActorLifecycleCallback callback
                //   define on Sprite ?
            }
            else {
                this.transform(SpriteTransformation.Frame, 1);
            }
        }, delay);
    }

    stop(): void {
        this._paused = true;
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    setFrame(frame: number): void {
        this.stop();
        this.setTransform(SpriteTransformation.Frame, frame);
    }

    getTransform(transformation: SpriteTransformation): number {
        return this.transformations[transformation];
    }

    transform(transformation: SpriteTransformation, delta: number): void {
        this.transformations[transformation] += delta;
    }

    setTransform(transformation: SpriteTransformation, value: number): void {
        this.transformations[transformation] = value;
    }

    draw(canvas: GameCanvas, x: number, y: number, options: SpriteDrawOptions = {}): void {
        if (this.sprite.image) {
            const animationFrame = this.getTransform(SpriteTransformation.Frame);
            const frame = (options.frame !== null && options.frame !== undefined) ? options.frame : animationFrame;
            options.frame = frame || 0;

            const animationOpacity = this.getTransform(SpriteTransformation.Opacity);
            const opacity = (options.opacity !== null && options.opacity !== undefined) ? options.opacity : animationOpacity;
            options.opacity = opacity || 1;

            const [srcX, srcY] = this.sprite.getFrameImageSourceCoords(animationFrame);
            
            canvas.drawImage(this.sprite.image, srcX, srcY, x, y, this.sprite.width, this.sprite.height, options);
        }
    }

    
}
