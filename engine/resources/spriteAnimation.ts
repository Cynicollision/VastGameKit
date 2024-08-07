import { ObjMap, SpriteTransformation } from './../core';
import { CanvasDrawImageOptions, GameCanvas } from './../device/canvas';
import { Sprite } from './sprite';

export type SpriteDrawOptions = CanvasDrawImageOptions & {
    frame?: number;
};

export class SpriteAnimation {
    private readonly sprite: Sprite;
    private transformations: ObjMap<SpriteTransformation> = {};
    private timer: NodeJS.Timeout;

    private _paused: boolean = true;
    get stopped(): boolean {
        return this._paused;
    }

    constructor(sprite: Sprite) {
        this.sprite = sprite;
        this.setTransform(SpriteTransformation.Frame, 0);
        this.setTransform(SpriteTransformation.Opacity, 1);
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
            
            canvas.drawImage(this.sprite.image, srcX, srcY, this.sprite.width, this.sprite.height, x, y, this.sprite.width, this.sprite.height, options);
        }
    }

    getTransform(transformation: SpriteTransformation): number {
        return this.transformations[transformation];
    }

    setFrame(frame: number): void {
        this.stop();
        this.setTransform(SpriteTransformation.Frame, frame);
    }

    setTransform(transformation: SpriteTransformation, value: number): void {
        this.transformations[transformation] = value;
    }

    start(start: number, end: number, delayMs: number): void {
        this.stop();
        this.setTransform(SpriteTransformation.Frame, start);

        this._paused = false;
        this.timer = setInterval(() => {
            if (this.getTransform(SpriteTransformation.Frame) === end) {
                this.setTransform(SpriteTransformation.Frame, start);
                // TODO: onAnimationEnd: ActorLifecycleCallback callback. define on Sprite ?
            }
            else {
                this.transform(SpriteTransformation.Frame, 1);
            }
        }, delayMs);
    }

    stop(): void {
        this._paused = true;
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    transform(transformation: SpriteTransformation, delta: number): void {
        this.transformations[transformation] += delta;
    }
}
