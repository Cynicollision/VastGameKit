import { GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneTransitionType } from './core';
import { GameCanvas } from './device/canvas';
import { Game } from './game';
import { Scene, GameScene } from './scene';
import { SceneTransition, SceneTransitionFactory, SceneTransitionOptions } from './sceneTransition';

export interface SceneController {
    game: Game;
    scene: GameScene;
    state: { [name: string]: unknown };
    getNextRuntimeID(): number;
    goToScene(sceneName: string): void;
    publishEvent(eventName: string, data?: any): void;
    transitionToScene(sceneName: string, options?: SceneTransitionOptions, transitionType?: SceneTransitionType): void;
}

export class Controller implements SceneController {
    readonly game: Game;

    private _scene: Scene;
    get scene(): GameScene { return this._scene; }

    private _eventQueue: GameEvent[] = [];
    private _transition: SceneTransition;

    readonly state: ObjMap<any> = {};

    constructor(game: Game, scene: Scene) {
        this.game = game;
        this._scene = scene;
    }

    private flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    draw(canvas: GameCanvas): void {
        this._scene.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(this.scene, canvas);
        }
    }

    getNextRuntimeID = (() => {
        let currentID = 0; // TODO will need to be instance-level to be able to save/restore from save state.
        return (() => ++currentID);
    })();

    // TODO: allow data to be passed to next scene
    goToScene(sceneName: string): void {
        this._scene.suspend(this);
        this._scene = <Scene>this.game.getScene(sceneName);
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
            this._scene = <Scene>this.game.getScene(sceneName);
            this._scene.startOrResume(this);
        }, () => {
            this._transition = null;
        });
    }
}
