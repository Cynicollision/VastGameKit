import { SceneTransitionType } from './core';
import { GameCanvas } from './device/canvas';
import { GameScene } from './scene';
import { SceneFadeTransition } from './ext/transitions/sceneFadeTransition';

export type SceneTransitionOptions = {
    color?: string;
    durationMs?: number;
}

export interface SceneTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(scene: GameScene, canvas: GameCanvas): void
}

export class SceneTransitionFactory {
    static new(type: SceneTransitionType, options: SceneTransitionOptions = {}): SceneTransition {
        switch (type) {
            case SceneTransitionType.Fade:
                return new SceneFadeTransition(options);  
        }
    }
}
