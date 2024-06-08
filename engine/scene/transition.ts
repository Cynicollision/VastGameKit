import { SceneTransitionType } from './../core';
import { GameCanvas } from './../device/canvas';
import { SceneFadeTransition } from './../ext/transitions/sceneFadeTransition';
import { GameScene } from './../scene';

export type SceneTransitionOptions = {
    color?: string;
    durationMs?: number;
    height?: number;
    portX?: number;
    portY?: number;
    width?: number;
}

export interface SceneTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(scene: GameScene, canvas: GameCanvas): void
}

export class SceneTransitionFactory {
    private static readonly DefaultDurationMs = 1000;
    
    static new(type: SceneTransitionType, options: SceneTransitionOptions = {}): SceneTransition {
        options.durationMs = options.durationMs || this.DefaultDurationMs;
        switch (type) {
            case SceneTransitionType.Fade:
                return new SceneFadeTransition(options);  
        }
    }
}
