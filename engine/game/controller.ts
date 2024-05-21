import { Game } from './game';
import { GameCanvas } from './../device';
import { GameEvent } from './gameEvent';
import { Scene, SceneTransition, SceneTransitionFactory, SceneTransitionOptions, SceneTransitionType } from './../scene';

export class GameController {
    private _currentScene: Scene;
    get currentScene() { return this._currentScene; }

    private _game: Game;
    get game() { return this._game; }

    private _eventQueue: GameEvent[] = [];
    private _transition: SceneTransition;

    state: { [name: string]: unknown } = {};

    constructor(game: Game) {
        this._game = game;
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
        if (this._currentScene) {
            this._currentScene.suspend(this);
        }
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

    draw(canvas: GameCanvas): void {
        if (this.currentScene) {
            this.currentScene.draw(this, canvas);

            if (this._transition) {
                this._transition.draw(this.currentScene, canvas);
            }
        }
    }
}
