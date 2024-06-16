import { SceneTransitionType } from './core';
import { GameCanvas } from './device/canvas';
import { SceneFadeTransition } from './ext/transitions/sceneFadeTransition';
import { SceneState } from './scene/sceneState';

export type SceneTransitionOptions = {
    color?: string;
    durationMs?: number;
    height?: number;
    portX?: number;
    portY?: number;
    type?: SceneTransitionType;
    width?: number;
}

export interface SceneTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(seneState: SceneState, canvas: GameCanvas): void
}

export class SceneTransitionFactory {
    private static readonly DefaultDurationMs = 1000;
    private static readonly DefaultTransitionType = SceneTransitionType.Fade;
    
    static new(options: SceneTransitionOptions = {}): SceneTransition {
        options.durationMs = options.durationMs || this.DefaultDurationMs;
        options.type = options.type || this.DefaultTransitionType;

        switch (options.type) {
            case SceneTransitionType.Fade:
                return new SceneFadeTransition(options);  
        }
    }
}
