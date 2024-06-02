import { MathUtil } from './../../core';
import { GameCanvas } from './../../device/canvas';
import { Scene } from './../../scene';
import { SceneTransition, SceneTransitionOptions } from './../../sceneTransition';

export class SceneFadeTransition implements SceneTransition {
    private static readonly DefaultColor = '#000';
    private static readonly DefaultDurationMs = 1000;

    private color: string;
    private currentValue = 0;
    private durationMs: number;
    private transitionIn = true;

    constructor(options: SceneTransitionOptions = {}) {
        this.color = options.color || '#000';
        this.durationMs = options.durationMs || 1000;
    }

    draw(scene: Scene, canvas: GameCanvas): void {
        const increment = (this.durationMs / 1000) / (scene.game.options.targetFPS / 4);
        this.currentValue += this.transitionIn ? increment : -increment;
        this.currentValue = MathUtil.clamp(Math.round(this.currentValue * 100) / 100, 0, 1);

        canvas.fillArea(this.color, 0, 0, scene.game.canvas.width, scene.game.canvas.height, { opacity: this.currentValue });
    }

    start(onTransitionallback: () => void, onEndCallback: () => void): void {
        setTimeout(() => {
            onTransitionallback();
            this.transitionIn = false;
            setTimeout(() => {
                onEndCallback();
            }, this.durationMs);
        }, this.durationMs);
    }
}