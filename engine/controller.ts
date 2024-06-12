import { GameEvent, GameTimer, GameTimerOptions, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneTransitionType } from './core';
import { GameCanvas } from './device/canvas';
import { GameResources } from './resources';
import { GameScene, Scene } from './scene';
import { SceneTransition, SceneTransitionFactory, SceneTransitionOptions } from './transition';

export type ControllerOptions = { 
    pulseLength: number;
};

export interface Controller {
    readonly currentStep: number;
    readonly resources: GameResources;
    readonly scene: Scene;
    readonly state: ObjMap<any>;
    goToScene(sceneName: string, data?: any): void;
    publishEvent(eventName: string, data?: any): void;
    startTimer(options: GameTimerOptions): GameTimer;
    transitionToScene(sceneName: string, options?: SceneTransitionOptions, data?: any): Promise<void>;
}

export class SceneController implements Controller {
    private _eventQueue: GameEvent[] = [];
    private _options: ControllerOptions;
    private _timers: GameTimer[] = [];
    private _transition: SceneTransition;

    readonly resources: GameResources;
    readonly state: ObjMap<any> = {};

    private _currentStep = 0;
    get currentStep() { return this._currentStep; }

    private _scene: GameScene;
    get scene(): Scene { return this._scene; }

    constructor(resources: GameResources, scene: GameScene, _options: ControllerOptions) {
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

    startTimer(options: GameTimerOptions): GameTimer {
        const timer = GameTimer.start(options);
        this._timers.push(timer);
        return timer;
    }

    draw(canvas: GameCanvas): void {
        this._scene.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(this.scene, canvas);
        }
    }

    // TODO: add/update tests for passing data between scenes
    goToScene(sceneName: string, data?: any): void {
        this._scene.suspend(this);
        this._scene = <GameScene>this.resources.getScene(sceneName);
        this._scene.startOrResume(this, data);
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
        
        this._timers.forEach(t => t.tick());

        for (const event of this.flushEventQueue()) {
            this._scene.handleGameEvent(event, this);
        }
        
        this._scene.step(this)
    }

    // TODO: add/update tests for passing data between scene transitions
    // Return Promise<void?> for optional "on transition end" callback
    //  (and for use in tests)
    transitionToScene(sceneName: string, options: SceneTransitionOptions = {}, data?: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this._scene.suspend(this);
            this._transition = SceneTransitionFactory.new(options);
            this._transition.start(() => {
                this._scene = <GameScene>this.resources.getScene(sceneName);
                this._scene.startOrResume(this, data);
            }, () => {
                this._transition = null;
                resolve();
            });
        });
        
    }
}
