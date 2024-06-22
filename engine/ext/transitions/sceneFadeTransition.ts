import { MathUtil } from './../../core';
import { GameCanvas } from './../../device/canvas';
import { SceneState } from './../../scene/sceneState';
import { SceneTransition, SceneTransitionOptions } from './../../transition';

export class SceneFadeTransition implements SceneTransition {
    private static readonly DefaultColor = '#000';
    private static readonly DefaultDurationMs = 1000;
    private static readonly TransitionIncrements = 20;

    private options: SceneTransitionOptions = {};

    private currentValue = 0;
    private transitionIn = true;

    constructor(options: SceneTransitionOptions = {}) {
        this.options = options;
        this.options.color = options.color || SceneFadeTransition.DefaultColor;
        this.options.durationMs = options.durationMs || SceneFadeTransition.DefaultDurationMs;
    }

    draw(sceneState: SceneState, canvas: GameCanvas): void {
        const increment = (1000 / this.options.durationMs) / SceneFadeTransition.TransitionIncrements;
        this.currentValue += this.transitionIn ? increment : -increment;
        this.currentValue = MathUtil.clamp(this.currentValue, 0, 1);

        if (this.currentValue >= 0.1) {
            const x = this.options.portX || 0;
            const y = this.options.portY || 0;
            const width = this.options.width || canvas.width;
            const height = this.options.height || canvas.height;

            canvas.fillArea(this.options.color, x, y, width, height, { opacity: this.currentValue });
        } 
    }

    start(onTransitionallback: () => void, onEndCallback: () => void): void {
        setTimeout(() => {
            onTransitionallback();
            this.transitionIn = false;
            setTimeout(() => {
                onEndCallback();
            }, this.options.durationMs);
        }, this.options.durationMs);
    }
}