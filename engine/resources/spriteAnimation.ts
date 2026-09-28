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

    constructor(sprite: Sprite) {
        this.sprite = sprite;
        this.setTransform(SpriteTransformation.Frame, 0);
        this.setTransform(SpriteTransformation.Opacity, 1);
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
            const opacity = options.opacity !== undefined ? options.opacity : this.getTransform(SpriteTransformation.Opacity);
            const [srcX, srcY] = this.sprite.getFrameImageSourceCoords(frame);

            canvas.drawImage(this.sprite.image, srcX, srcY, this.sprite.width, this.sprite.height, x, y, this.sprite.width, this.sprite.height, { ...options, opacity: opacity });
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
