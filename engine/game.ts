import { GameError, ObjMap } from './core';
import { GameAudio, GameAudioOptions } from './device/audio';
import { GameCanvas, GameCanvasHtml2D } from './device/canvas';
import { GameInputHandler } from './device/input';
import { Actor, ActorDefinition, ActorOptions } from './actor';
import { Controller } from './controller';
import { Scene, GameScene, SceneOptions } from './scene';
import { Sprite, SpriteOptions } from './sprite';
import { GameResources } from './gameResources';

export type GameOptions = {
    canvasElementId: string;
    targetFPS?: number;
    defaultSceneOptions?: SceneOptions;
};

export class Game {  
    private static readonly DefaultSceneName = 'default';
    private static readonly DefaultTargetFPS = 60;

    readonly controller: Controller;
    readonly resources: GameResources;

    private readonly _options: GameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultScene: Scene;
    get defaultScene(): GameScene { return this._defaultScene; }

    static init(options: GameOptions): Game {
        try {
            const canvasElement = <HTMLCanvasElement>document.getElementById(options.canvasElementId);
            const canvas = GameCanvasHtml2D.initForElement(canvasElement);
            const inputHandler = GameInputHandler.initForElement(document.body);

            return new Game(canvas, inputHandler, options);
        }
        catch (error) {
            const message = error.message ? error.message : error;
            // TODO: Add GameLog back
            console.error(`Vastgame failed to initialize. ${message}`);
            throw new GameError(message, error);
        }
    }

    constructor(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions) {
        this._canvas = canvas;
        this._inputHandler = inputHandler;
        this._options = this.applyGameOptions(options);

        this.resources = new GameResources();

        this._defaultScene = <Scene>this.resources.defineScene(Game.DefaultSceneName, this._options.defaultSceneOptions);
        this.controller = new Controller(this.resources, this._defaultScene, { pulseLength: this.options.targetFPS });
    }

    private applyGameOptions(options: GameOptions): GameOptions {
        options.targetFPS = options.targetFPS || Game.DefaultTargetFPS;
        return options;
    }

    load(): Promise<void> {
        return this.resources.load();
    }

    start(): void {
        this._inputHandler.keyboard.subscribe(ev => this.controller.onKeyboardEvent(ev));
        this._inputHandler.pointer.subscribe(ev => this.controller.onPointerEvent(ev));

        let offset = 0;
        let previous = window.performance.now();
        const stepSize = 1 / this.options.targetFPS;

        (<Scene>this.controller.scene).startOrResume(this.controller);

        const gameLoop: FrameRequestCallback = (): void => {
            const current = window.performance.now();
            offset += (Math.min(1, (current - previous) / 1000));

            while (offset > stepSize) {
                this.controller.step();
                offset -= stepSize;
            }

            this.controller.draw(this._canvas);
            previous = current;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
