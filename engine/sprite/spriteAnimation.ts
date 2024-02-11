import { GameCanvas } from './../device';
import { Sprite, SpriteTransformation } from './sprite';

export interface DrawSpriteOptions {
    frame?: number;
    opacity?: number;
    tileX?: boolean;
    tileY?: boolean;
}

export class SpriteAnimation {
    private sprite: Sprite;
    private transformations: { [index: number]: SpriteTransformation } = {};
    private timer: NodeJS.Timeout;

    depth: number = 0;

    private _paused: boolean = true;
    get paused(): boolean {
        return this._paused;
    }

    private constructor() {}

    static forSprite(sprite: Sprite): SpriteAnimation {
        const animation: SpriteAnimation = new SpriteAnimation();
        animation.sprite = sprite;

        animation.setTransform(SpriteTransformation.Frame, 0);
        animation.setTransform(SpriteTransformation.Opacity, 1);

        return animation;
    }

    start(start: number, end: number, delay?: number): void {
        this.stop();
        this.setTransform(SpriteTransformation.Frame, start);

        this._paused = false;
        this.timer = setInterval(() => {
            if (this.getTransform(SpriteTransformation.Frame) === end) {
                this.setTransform(SpriteTransformation.Frame, start);
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

    draw(canvas: GameCanvas, x: number, y: number, options: DrawSpriteOptions = {}): void {
        if (this.sprite.image) {
            // frame
            const frame = this.getTransform(SpriteTransformation.Frame);
            if (options.frame !== null && options.frame !== undefined) {
                this.setTransform(SpriteTransformation.Frame, options.frame);
            }

            // opacity TODO where does this get used or how
            const opacity = this.getTransform(SpriteTransformation.Opacity);
            if (options.frame !== null && options.frame !== undefined) {
                this.setTransform(SpriteTransformation.Opacity, options.opacity);
            }

            const [srcX, srcY] = this.sprite.getFrameImageSourceCoords(frame);
            
            canvas.drawImage(this.sprite.image, srcX, srcY, x, y, this.sprite.width, this.sprite.height, options);
        }
    }

    // transformations
    getTransform(transformation: SpriteTransformation): number {
        return this.transformations[transformation];
    }

    transform(transformation: SpriteTransformation, delta: number): void {
        this.transformations[transformation] += delta;
    }

    setTransform(transformation: SpriteTransformation, value: number): void {
        this.transformations[transformation] = value;
    }
}
