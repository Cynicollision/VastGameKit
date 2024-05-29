import { SceneTransitionType } from './../core/enum';
import { GameEvent, KeyboardInputEvent, PointerInputEvent } from './../core/events';
import { GameCanvas } from './../device/canvas';
import { Game } from './../game';
import { Scene, GameScene } from './scene';
import { SceneTransition, SceneTransitionFactory, SceneTransitionOptions } from './transition';

export interface SceneController {
    game: Game;
    scene: GameScene;
    state: { [name: string]: unknown };
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

    readonly state: { [name: string]: unknown } = {};

    constructor(game: Game, scene: Scene) {
        this.game = game;
        this.setCurrentScene(scene);
    }

    private flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    private setCurrentScene(scene: Scene): void {
        this._scene = scene;
        scene.init();
    }

    private suspendCurrentScene(): void {
        this._scene.suspend(this);
    }

    draw(canvas: GameCanvas): void {
        this._scene.draw(canvas, this);

        if (this._transition) {
            this._transition.draw(this.scene, canvas);
        }
    }

    // TODO: allow data to be passed to next scene
    goToScene(sceneName: string): void {
        this.suspendCurrentScene();
        const scene = <Scene>this.game.getScene(sceneName);
        this.setCurrentScene(scene);
    }

    publishEvent(eventName: string, data?: any): void {
        const event = GameEvent.init(eventName, data);
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
        this.suspendCurrentScene();
        this._transition = SceneTransitionFactory.new(transitionType, options);
        this._transition.start(() => {
            const scene = <Scene>this.game.getScene(sceneName);
            this.setCurrentScene(scene);
        }, () => {
            this._transition = null;
        });
    }
}
