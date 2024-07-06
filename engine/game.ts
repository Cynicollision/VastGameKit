import { GameError } from './core';
import { GameCanvas, GameCanvasHtml2D, GameCanvasOptions } from './device/canvas';
import { GameInputHandler } from './device/input';
import { GameConstruction } from './structure/construction';
import { GameScene, Scene, SceneOptions } from './structure/scene';
import { SceneController } from './state/controller';

export type GameOptions = {
    canvasElementId: string;
    targetFPS?: number;
    canvasOptions?: GameCanvasOptions;
    defaultSceneOptions?: SceneOptions;
};

export class Game {  
    static readonly DefaultSceneName = 'default';
    private static readonly DefaultTargetFPS = 60;

    readonly controller: SceneController;
    readonly construction: GameConstruction;

    private readonly _options: GameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultScene: GameScene;
    get defaultScene(): Scene { return this._defaultScene; }

    static init(options: GameOptions): Game {
        try {
            const canvasElement = <HTMLCanvasElement>document.getElementById(options.canvasElementId);
            const canvas = GameCanvasHtml2D.initForElement(canvasElement, options.canvasOptions);
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

        this.construction = new GameConstruction();

        this._defaultScene = <GameScene>this.construction.scenes.add(Game.DefaultSceneName, this._options.defaultSceneOptions);
        this.controller = new SceneController(this.construction, this._defaultScene, { pulseLength: this.options.targetFPS });
    }

    private applyGameOptions(options: GameOptions): GameOptions {
        options.targetFPS = options.targetFPS || Game.DefaultTargetFPS;
        return options;
    }

    load(): Promise<Game> {
        return this.construction.load().then(() => Promise.resolve(this));
    }

    start(): void {
        this._inputHandler.keyboard.subscribe(ev => this.controller.onKeyboardEvent(ev));
        this._inputHandler.pointer.subscribe(ev => this.controller.onPointerEvent(ev));

        let offset = 0;
        let previous = window.performance.now();
        const stepSize = 1 / this.options.targetFPS;

        this.controller.sceneState.startOrResume(this.controller);

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
