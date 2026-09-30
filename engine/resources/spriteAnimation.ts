import { ObjMap, SpriteTransformation } from './../core';
import { CanvasDrawImageOptions, GameCanvas } from './../device/canvas';
import { Sprite } from './sprite';

export type SpriteDrawOptions = CanvasDrawImageOptions & {
    frame?: number;
};

export type SpriteAnimationOptions = {
    // when false, the animation stops on its end frame instead of restarting.
    loop?: boolean;
    // called each time the end frame finishes displaying.
    onEnd?: () => void;
};

// Advances through a Sprite's frames as the game steps. Stepping is driven by its Instance,
// so an animation pauses whenever its Instance or Scene isn't stepping.
export class SpriteAnimation {
    readonly sprite: Sprite;
    private transformations: ObjMap<number> = {};

    private startFrame = 0;
    private endFrame = 0;
    private delayMs = 0;
    private elapsedMs = 0;
    private loop = true;
    private onEnd?: () => void;

    private _paused: boolean = true;
    get stopped(): boolean {
        return this._paused;
    }

    // whether the sprite is drawn mirrored left to right, e.g. to face the other way.
    get flipX(): boolean { return this.getTransform(SpriteTransformation.ScaleX) < 0; }
    set flipX(value: boolean) {
        this.setTransform(SpriteTransformation.ScaleX, Math.abs(this.getTransform(SpriteTransformation.ScaleX)) * (value ? -1 : 1));
    }

    // whether the sprite is drawn upside down.
    get flipY(): boolean { return this.getTransform(SpriteTransformation.ScaleY) < 0; }
    set flipY(value: boolean) {
        this.setTransform(SpriteTransformation.ScaleY, Math.abs(this.getTransform(SpriteTransformation.ScaleY)) * (value ? -1 : 1));
    }

    // How far the drawn sprite may extend beyond its frame on each side, due to scale and rotation.
    get overhang(): number {
        const scale = Math.max(Math.abs(this.getTransform(SpriteTransformation.ScaleX)), Math.abs(this.getTransform(SpriteTransformation.ScaleY)));
        const size = this.getTransform(SpriteTransformation.Rotation) % 360 !== 0
            ? Math.sqrt(this.sprite.width * this.sprite.width + this.sprite.height * this.sprite.height)
            : Math.max(this.sprite.width, this.sprite.height);

        return Math.max(0, (size * scale - Math.min(this.sprite.width, this.sprite.height)) / 2);
    }

    constructor(sprite: Sprite) {
        this.sprite = sprite;
        this.setTransform(SpriteTransformation.Frame, 0);
        this.setTransform(SpriteTransformation.Opacity, 1);
        this.setTransform(SpriteTransformation.ScaleX, 1);
        this.setTransform(SpriteTransformation.ScaleY, 1);
        this.setTransform(SpriteTransformation.Rotation, 0);
    }

    private advanceFrame(): void {
        const frame = this.getTransform(SpriteTransformation.Frame);

        if (frame === this.endFrame) {
            if (this.loop) {
                this.setTransform(SpriteTransformation.Frame, this.startFrame);
            }
            else {
                this._paused = true;
            }

            if (this.onEnd) {
                this.onEnd();
            }
        }
        else {
            this.transform(SpriteTransformation.Frame, this.endFrame > this.startFrame ? 1 : -1);
        }
    }

    draw(canvas: GameCanvas, x: number, y: number, options: SpriteDrawOptions = {}): void {
        if (this.sprite.image) {
            const frame = options.frame !== undefined ? options.frame : this.getTransform(SpriteTransformation.Frame);
            const [srcX, srcY] = this.sprite.getFrameImageSourceCoords(frame);

            canvas.drawImage(this.sprite.image, srcX, srcY, this.sprite.width, this.sprite.height, x, y, this.sprite.width, this.sprite.height, {
                ...options,
                opacity: options.opacity !== undefined ? options.opacity : this.getTransform(SpriteTransformation.Opacity),
                rotation: options.rotation !== undefined ? options.rotation : this.getTransform(SpriteTransformation.Rotation),
                scaleX: options.scaleX !== undefined ? options.scaleX : this.getTransform(SpriteTransformation.ScaleX),
                scaleY: options.scaleY !== undefined ? options.scaleY : this.getTransform(SpriteTransformation.ScaleY),
            });
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

    start(start: number, end: number, delayMs: number, options: SpriteAnimationOptions = {}): void {
        this.setTransform(SpriteTransformation.Frame, start);
        this.startFrame = start;
        this.endFrame = end;
        this.delayMs = delayMs;
        this.elapsedMs = 0;
        this.loop = options.loop !== undefined ? options.loop : true;
        this.onEnd = options.onEnd;
        this._paused = false;
    }

    step(elapsedMs: number): void {
        if (this._paused || this.delayMs <= 0) {
            return;
        }

        this.elapsedMs += elapsedMs;

        while (!this._paused && this.elapsedMs >= this.delayMs) {
            this.elapsedMs -= this.delayMs;
            this.advanceFrame();
        }
    }

    stop(): void {
        this._paused = true;
    }

    transform(transformation: SpriteTransformation, delta: number): void {
        this.transformations[transformation] += delta;
    }
}
