import { FixedStepClock, GameError } from './core';
import { GameCanvas, GameCanvasHtml2D, GameCanvasOptions } from './device/canvas';
import { GameInputHandler } from './device/input';
import { GameStorage } from './device/storage';
import { GameConstruction } from './structure/construction';
import { GameScene, Scene, SceneOptions } from './structure/scene';
import { SceneController } from './state/controller';

export type GameOptions = {
    canvasElementId: string;
    // keeps the game's saved values separate from other games on the same site. Default: canvasElementId.
    name?: string;
    targetFPS?: number;
    canvasOptions?: GameCanvasOptions;
    defaultSceneOptions?: SceneOptions;
    // whether the game keeps running while its browser tab is hidden. Default false.
    runWhileHidden?: boolean;
};

type ResolvedGameOptions = GameOptions & {
    targetFPS: number;
};

export class Game {
    static readonly DefaultSceneName = 'default';
    private static readonly DefaultTargetFPS = 60;
    // the most steps run for one frame, e.g. after a slow frame.
    private static readonly MaxStepsPerFrame = 10;

    readonly controller: SceneController;
    readonly construction: GameConstruction;

    private readonly _options: ResolvedGameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultScene: GameScene;
    get defaultScene(): Scene { return this._defaultScene; }

    private readonly clock: FixedStepClock;
    private hidden = false;

    private _paused = false;
    // whether the game has been paused. A paused game draws, but doesn't step.
    get paused() { return this._paused; }

    static init(options: GameOptions): Game {
        try {
            const canvasElement = <HTMLCanvasElement>document.getElementById(options.canvasElementId);
            const canvas = GameCanvasHtml2D.initForElement(canvasElement, options.canvasOptions);
            const inputHandler = GameInputHandler.initForElement(document.body, canvasElement);
            const game = new Game(canvas, inputHandler, options, new GameStorage(options.name || options.canvasElementId));
            game.controller.audio.unlockOnUserGesture(document);

            return game;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Vastgame failed to initialize. ${message}`);
            throw new GameError(message, error instanceof Error ? error : undefined);
        }
    }

    constructor(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions, storage?: GameStorage) {
        this._canvas = canvas;
        this._inputHandler = inputHandler;
        this._options = this.applyGameOptions(options);

        this.construction = new GameConstruction();

        this._defaultScene = <GameScene>this.construction.scenes.add(Game.DefaultSceneName, this._options.defaultSceneOptions);
        this.controller = new SceneController(this.construction, this._defaultScene, { targetFPS: this.options.targetFPS, storage: storage });
        this.clock = new FixedStepClock(this.controller.stepDurationMs, Game.MaxStepsPerFrame);
    }

    private applyGameOptions(options: GameOptions): ResolvedGameOptions {
        return { ...options, targetFPS: options.targetFPS || Game.DefaultTargetFPS };
    }

    load(): Promise<Game> {
        return this.construction.load(this.controller.audio.context).then(() => Promise.resolve(this));
    }

    // Stops stepping the game and pauses its audio, until resume. Drawing continues.
    pause(): void {
        this._paused = true;
        this.updateRunning();
    }

    resume(): void {
        this._paused = false;
        this.updateRunning();
    }

    // Updates whether the game is hidden, e.g. in a background tab. Hidden games pause unless runWhileHidden is set.
    setHidden(hidden: boolean): void {
        this.hidden = hidden && !this.options.runWhileHidden;
        this.updateRunning();
    }

    private get running(): boolean {
        return !this._paused && !this.hidden;
    }

    private updateRunning(): void {
        if (this.running) {
            this.controller.audio.resume();
        }
        else {
            this.controller.audio.suspend();
            // time spent paused isn't caught up on.
            this.clock.reset();
        }
    }

    // Runs the steps due at the given time, then draws.
    frame(nowMs: number): void {
        if (this.running) {
            const steps = this.clock.advance(nowMs);

            for (let i = 0; i < steps; i++) {
                this.controller.step();
            }
        }

        this._canvas.clear();
        this.controller.draw(this._canvas);
    }

    start(): void {
        this._inputHandler.keyboard.subscribe(ev => this.controller.onKeyboardEvent(ev));
        this._inputHandler.pointer.subscribe(ev => this.controller.onPointerEvent(ev));

        document.addEventListener('visibilitychange', () => this.setHidden(document.hidden));
        this.setHidden(document.hidden);

        this.controller.sceneState.startOrResume(this.controller);

        const gameLoop: FrameRequestCallback = (now: number): void => {
            this.frame(now);
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
