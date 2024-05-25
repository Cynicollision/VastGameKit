import { Game } from './game';
import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameEvent } from './gameEvent';
import { Scene, SceneStatus, SceneTransition, SceneTransitionFactory, SceneTransitionOptions, SceneTransitionType } from './../scene';

export class GameController {
    private _currentScene: Scene;
    get currentScene() { return this._currentScene; }

    private _game: Game;
    get game() { return this._game; }

    private _eventQueue: GameEvent[] = [];
    private _transition: SceneTransition;

    state: { [name: string]: unknown } = {};

    constructor(game: Game, scene: Scene) {
        this._game = game;
        this.setCurrentScene(scene);
    }

    goToScene(sceneName: string): void {
        this.suspendCurrentScene();
        this.setCurrentScene(this.game.getScene(sceneName));
    }

    transitionToScene(sceneName: string, options: SceneTransitionOptions = {}, transitionType: SceneTransitionType = SceneTransitionType.Fade): void {
        this.suspendCurrentScene();
        this._transition = SceneTransitionFactory.new(transitionType, options);
        this._transition.start(() => {
            this.setCurrentScene(this.game.getScene(sceneName));
        }, () => {
            this._transition = null;
        });
    }

    private setCurrentScene(scene: Scene): void {
        this._currentScene = scene;
        scene.init();
    }

    private suspendCurrentScene(): void {
        this._currentScene.suspend(this);
    }

    raiseEvent(eventName: string, data?: any): void {
        this._eventQueue.push(new GameEvent(eventName, data));
    }

    getQueuedEvents(): GameEvent[] {
        return this._eventQueue;
    }

    flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];
        return queue;
    }

    onKeyboardEvent(event: KeyboardInputEvent): void {
        this._currentScene.propogateKeyboardEvent(this, event);
    }

    onPointerEvent(event: PointerInputEvent): void {
        this._currentScene.propogatePointerEvent(this, event);
    }

    step(): void {
        // TODO: move to Scene.step
        switch (this._currentScene.status) {
            case SceneStatus.Starting:
                this._currentScene.start(this);
                break;
            case SceneStatus.Resuming:
                this._currentScene.resume(this);
                break;
            case SceneStatus.Suspended:
                this._currentScene.suspend(this); // TODO this seems unnecessary
                break;
            case SceneStatus.Running:
                this._currentScene.step(this);
                break;
        }

        this.flushEventQueue();
    }

    draw(canvas: GameCanvas): void {
        this._currentScene.draw(this, canvas);

        if (this._transition) {
            this._transition.draw(this.currentScene, canvas);
        }
    }
}
