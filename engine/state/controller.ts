import { GameEvent, GameTimer, GameTimerOptions, GameTimerSet, KeyboardInputEvent, ObjMap, PointerInputEvent } from './../core';
import { GameAudio } from './../device/audio';
import { GameCanvas } from './../device/canvas';
import { GameConstruction } from './../structure/construction';
import { GameScene, Scene } from './../structure/scene';
import { SceneState } from './sceneState';
import { SceneTransition, SceneTransitionOptions } from './transition';

export type ControllerOptions = {
    targetFPS: number;
};

export interface Controller {
    // counts steps from 0 up to targetFPS - 1, then repeats.
    readonly currentStep: number;
    // the game time that passes each step.
    readonly stepDurationMs: number;
    readonly audio: GameAudio;
    readonly gameConstruction: GameConstruction;
    readonly sceneState: SceneState;
    readonly state: ObjMap<any>;
    goToScene(sceneName: string, data?: any): void;
    onSceneChange(callback: (oldScene: SceneState, newScene: SceneState) => void): void;
    // TODO:
    //onStateLoad(callback: (saveState: GameSaveState) => void): void;
    //onStateLoad(callback: (saveState: GameSaveState) => void): void;
    publishEvent(eventName: string, data?: any): void;
    // starts a GameTimer that ticks every step regardless of Scene. See SceneState.startTimer for Scene-scoped timers.
    startTimer(options: GameTimerOptions): GameTimer;
    transitionToScene(sceneName: string, options?: SceneTransitionOptions, data?: any): Promise<void>;
}

export class SceneController implements Controller {
    private _eventQueue: GameEvent[] = [];
    private _options: ControllerOptions;
    private _persistentSceneStateMap: ObjMap<SceneState> = {};
    private readonly _timers = new GameTimerSet();
    private _transition?: SceneTransition;
    private _transitionPromise?: Promise<void>;

    private onSceneChangeCallback?: (oldScene: SceneState, newScene: SceneState) => void;

    readonly audio: GameAudio;
    readonly gameConstruction: GameConstruction;
    readonly state: ObjMap<any> = {};
    readonly stepDurationMs: number;

    private _currentStep = 0;
    get currentStep() { return this._currentStep; }

    private _currentSceneState: SceneState;
    get sceneState(): SceneState { return this._currentSceneState; }

    constructor(construction: GameConstruction, initialScene: Scene, _options: ControllerOptions) {
        this.audio = new GameAudio(construction);
        this.gameConstruction = construction;
        this._options = _options;
        this.stepDurationMs = 1000 / _options.targetFPS;
        this._currentSceneState = this.getSceneState(initialScene.name);
    }

    private changeScene(sceneName: string, data?: any): void {
        const oldSceneState = this._currentSceneState;
        this._currentSceneState = this.getSceneState(sceneName);

        if (this.onSceneChangeCallback) {
            this.onSceneChangeCallback(oldSceneState, this._currentSceneState);
        }

        this._currentSceneState.startOrResume(this, data);
    }

    private flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    private incrementCurrentStep(): void {
        this._currentStep++;
        if (this._currentStep >= this._options.targetFPS) {
            this._currentStep = 0;
        }
    }

    draw(canvas: GameCanvas): void {
        this._currentSceneState.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(canvas);
        }
    }

    getSceneState(sceneName: string): SceneState {
        const scene = <GameScene>this.gameConstruction.scenes.get(sceneName);

        if (scene.persistent) {
            if (!this._persistentSceneStateMap[scene.name]) {
                this._persistentSceneStateMap[scene.name] = scene.newState(this);
            }

            return this._persistentSceneStateMap[scene.name];
        }

        return scene.newState(this);
    }

    goToScene(sceneName: string, data?: any): SceneState {
        this._currentSceneState.suspend(this);
        this.changeScene(sceneName, data);

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

    onSceneChange(callback: (oldScene: SceneState, newScene: SceneState) => void): void {
        this.onSceneChangeCallback = callback;
    }

    startTimer(options: GameTimerOptions): GameTimer {
        return this._timers.start(options);
    }

    step(): void {
        this.incrementCurrentStep();
        this._timers.step();

        if (this._transition) {
            this._transition.step(this.stepDurationMs);
        }

        for (const event of this.flushEventQueue()) {
            this._currentSceneState.handleGameEvent(event, this);
        }
        
        this._currentSceneState.step(this)
    }

    // Only one transition runs at a time; requests made during a transition return the one in progress.
    transitionToScene(sceneName: string, options: SceneTransitionOptions = {}, data?: any): Promise<void> {
        if (this._transitionPromise) {
            return this._transitionPromise;
        }

        this._currentSceneState.suspend(this);

        this._transitionPromise = new Promise(resolve => {
            this._transition = new SceneTransition(options, () => this.changeScene(sceneName, data), () => {
                this._transition = undefined;
                this._transitionPromise = undefined;
                resolve();
            });
        });

        return this._transitionPromise;
    }
}
