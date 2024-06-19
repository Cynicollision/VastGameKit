import { GameEvent, GameTimer, GameTimerOptions, KeyboardInputEvent, ObjMap, PointerInputEvent } from './core';
import { GameCanvas } from './device/canvas';
import { GameResources } from './resources';
import { GameScene, Scene } from './scene';
import { SceneState } from './scene/sceneState';
import { SceneTransition, SceneTransitionFactory, SceneTransitionOptions } from './transition';

export type ControllerOptions = { 
    pulseLength: number;
};

export interface Controller {
    readonly currentStep: number;
    readonly resources: GameResources;
    readonly sceneState: SceneState;
    readonly state: ObjMap<any>;
    goToScene(sceneName: string, data?: any): void;
    publishEvent(eventName: string, data?: any): void;
    startTimer(options: GameTimerOptions): GameTimer;
    transitionToScene(sceneName: string, options?: SceneTransitionOptions, data?: any): Promise<void>;
}

export class SceneController implements Controller {
    private _eventQueue: GameEvent[] = [];
    private _options: ControllerOptions;
    private _persistentSceneStateMap: ObjMap<SceneState> = {};
    private _timers: GameTimer[] = [];
    private _transition: SceneTransition;

    readonly resources: GameResources;
    readonly state: ObjMap<any> = {};

    private _currentStep = 0;
    get currentStep() { return this._currentStep; }

    private _currentSceneState: SceneState;
    get sceneState(): SceneState { return this._currentSceneState; }

    constructor(resources: GameResources, initialScene: Scene, _options: ControllerOptions) {
        this.resources = resources;
        this._currentSceneState = this.getSceneState(initialScene.name);
        this._options = _options;
    }

    private flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    private incrementCurrentStep(): void {
        this._currentStep++;
        if (this._currentStep === this._options.pulseLength) {
            this._currentStep = 0;
        }
    }

    getSceneState(sceneName: string): SceneState {
        const scene = <GameScene>this.resources.getScene(sceneName);

        if (scene.persistent) {
            if (!this._persistentSceneStateMap[scene.name]) {
                this._persistentSceneStateMap[scene.name] = scene.newState(this);
            }

            return this._persistentSceneStateMap[scene.name];
        }

        return scene.newState(this);
    }

    startTimer(options: GameTimerOptions): GameTimer {
        const timer = GameTimer.start(options);
        this._timers.push(timer);
        return timer;
    }

    draw(canvas: GameCanvas): void {
        this._currentSceneState.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(this._currentSceneState, canvas);
        }
    }

    goToScene(sceneName: string, data?: any): SceneState {
        this._currentSceneState.suspend(this);
        this._currentSceneState = this.getSceneState(sceneName);
        this._currentSceneState.startOrResume(this, data);

        return this._currentSceneState;
    }

    publishEvent(eventName: string, data?: any): void {
        const event = GameEvent.new(eventName, data);
        this._eventQueue.push(event);
    }

    onKeyboardEvent(event: KeyboardInputEvent): void {
        this._currentSceneState.handleKeyboardEvent(event, this);
    }

    onPointerEvent(event: PointerInputEvent): void {
        this._currentSceneState.handlePointerEvent(event, this);
    }

    step(): void {
        this.incrementCurrentStep();
        this._timers.forEach(t => t.tick());

        for (const event of this.flushEventQueue()) {
            this._currentSceneState.handleGameEvent(event, this);
        }
        
        this._currentSceneState.step(this)
    }

    transitionToScene(sceneName: string, options: SceneTransitionOptions = {}, data?: any): Promise<void> {
        return new Promise(resolve => {
            this._currentSceneState.suspend(this);
            this._transition = SceneTransitionFactory.new(options);
            this._transition.start(() => {
                this._currentSceneState = this.getSceneState(sceneName);
                this._currentSceneState.startOrResume(this, data);
            }, () => {
                this._transition = null;
                resolve();
            });
        });
    }
}
