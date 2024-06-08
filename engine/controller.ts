import { GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneTransitionType } from './core';
import { GameCanvas } from './device/canvas';
import { GameResources } from './resources';
import { Scene, GameScene } from './scene';
import { SceneTransition, SceneTransitionFactory, SceneTransitionOptions } from './scene/transition';

export type ControllerOptions = { 
    pulseLength: number;
};

// TODO rename -> Controller
export interface SceneController {
    currentStep: number;
    resources: GameResources;
    scene: GameScene;
    state: ObjMap<any>;
    goToScene(sceneName: string): void;
    publishEvent(eventName: string, data?: any): void;
    transitionToScene(sceneName: string, options?: SceneTransitionOptions, transitionType?: SceneTransitionType): void;
}

// TODO rename -> SceneController
export class Controller implements SceneController {
    private _eventQueue: GameEvent[] = [];
    private _options: ControllerOptions;
    private _transition: SceneTransition;

    readonly resources: GameResources;
    readonly state: ObjMap<any> = {};

    private _currentStep = 0;
    get currentStep() { return this._currentStep; }

    private _scene: Scene;
    get scene(): GameScene { return this._scene; }

    constructor(resources: GameResources, scene: Scene, _options: ControllerOptions) {
        this.resources = resources;
        this._scene = scene;
        this._options = _options;
    }

    private flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    private updateCurrentStep(): void {
        this._currentStep++;
        if (this._currentStep === this._options.pulseLength) {
            this._currentStep = 0;
        }
    }

    draw(canvas: GameCanvas): void {
        this._scene.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(this.scene, canvas);
        }
    }

    // TODO: allow data to be passed to next scene
    goToScene(sceneName: string): void {
        this._scene.suspend(this);
        this._scene = <Scene>this.resources.getScene(sceneName);
        this._scene.startOrResume(this);
    }

    publishEvent(eventName: string, data?: any): void {
        const event = GameEvent.new(eventName, data);
        this._eventQueue.push(event);
    }

    onKeyboardEvent(event: KeyboardInputEvent): void {
        this._scene.handleKeyboardEvent(event, this);
    }

    onPointerEvent(event: PointerInputEvent): void {
        this._scene.handlePointerEvent(event, this);
    }

    step(): void {
        this.updateCurrentStep();
        // TODO: call "pulse" event here. pass to scene -> instances

        for (const event of this.flushEventQueue()) {
            this._scene.handleGameEvent(event, this);
        }
        
        this._scene.step(this)
    }

    // TODO: allow data to be passed to next scene
    transitionToScene(sceneName: string, options: SceneTransitionOptions = {}, transitionType: SceneTransitionType = SceneTransitionType.Fade): void {
        this._scene.suspend(this);
        this._transition = SceneTransitionFactory.new(transitionType, options);
        this._transition.start(() => {
            this._scene = <Scene>this.resources.getScene(sceneName);
            this._scene.startOrResume(this);
        }, () => {
            this._transition = null;
        });
    }
}
