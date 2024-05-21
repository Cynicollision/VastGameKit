import { GameCanvas } from './../device';
import { Scene } from './scene';
import { SceneFadeTransition } from './transitions/sceneFadeTransition';

export enum SceneTransitionType {
    Fade = 'Fade',
}

export type SceneTransitionOptions = {
    color?: string;
    durationMs?: number;
}

export interface SceneTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(scene: Scene, canvas: GameCanvas): void
}

export class SceneTransitionFactory {
    static new(type: SceneTransitionType, options: SceneTransitionOptions = {}): SceneTransition {
        switch (type) {
            case SceneTransitionType.Fade:
                return new SceneFadeTransition(options);  
        }
    }
}
