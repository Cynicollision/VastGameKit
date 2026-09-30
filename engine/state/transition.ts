import { MathUtil } from './../core';
import { GameCanvas } from './../device/canvas';

export type SceneTransitionOptions = {
    color?: string;
    // duration of each half of the transition: fading out, then fading in.
    durationMs?: number;
    height?: number;
    portX?: number;
    portY?: number;
    width?: number;
};

// Fades to a color, calls onMidpoint (where the Scene changes), then fades back in and calls onEnd.
export class SceneTransition {
    private static readonly DefaultColor = '#000';
    private static readonly DefaultDurationMs = 1000;

    private readonly options: SceneTransitionOptions;
    private readonly color: string;
    private readonly durationMs: number;
    private readonly onMidpoint: () => void;
    private readonly onEnd: () => void;

    private opacity = 0;
    private fadingIn = false;

    constructor(options: SceneTransitionOptions, onMidpoint: () => void, onEnd: () => void) {
        this.options = options;
        this.color = options.color || SceneTransition.DefaultColor;
        this.durationMs = options.durationMs || SceneTransition.DefaultDurationMs;
        this.onMidpoint = onMidpoint;
        this.onEnd = onEnd;
    }

    draw(canvas: GameCanvas): void {
        if (this.opacity > 0) {
            const x = this.options.portX || 0;
            const y = this.options.portY || 0;
            const width = this.options.width || canvas.width;
            const height = this.options.height || canvas.height;

            canvas.fillArea(this.color, x, y, width, height, { opacity: this.opacity });
        }
    }

    step(elapsedMs: number): void {
        const change = elapsedMs / this.durationMs;

        if (!this.fadingIn) {
            this.opacity = MathUtil.clamp(this.opacity + change, 0, 1);
            if (this.opacity === 1) {
                this.fadingIn = true;
                this.onMidpoint();
            }
        }
        else {
            this.opacity = MathUtil.clamp(this.opacity - change, 0, 1);
            if (this.opacity === 0) {
                this.onEnd();
            }
        }
    }
}
