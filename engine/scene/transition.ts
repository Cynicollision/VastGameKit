import { SceneTransitionType } from './../core/enum';
import { GameCanvas } from './../device/canvas';
import { SceneDefinition } from './scene';
import { SceneFadeTransition } from './transitions/sceneFadeTransition';

export type SceneTransitionOptions = {
    color?: string;
    durationMs?: number;
}

export interface SceneTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(scene: SceneDefinition, canvas: GameCanvas): void
}

export class SceneTransitionFactory {
    static new(type: SceneTransitionType, options: SceneTransitionOptions = {}): SceneTransition {
        switch (type) {
            case SceneTransitionType.Fade:
                return new SceneFadeTransition(options);  
        }
    }
}
