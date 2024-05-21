import { Actor, ActorOptions } from './../actor';
import { GameAudio, GameAudioOptions, GameCanvas, GameInputHandler, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameController } from './controller';
import { GameError } from './gameError';
import { GameLifecycle } from './lifecycle';
import { Scene, SceneOptions } from './../scene';
import { Sprite, SpriteOptions } from './../sprite';

export type GameOptions = {
    canvasElementId: string;
    canvasScale?: number; // TODO: implement
    targetFPS?: number;
    defaultSceneOptions?: SceneOptions;
};

export class Game {  
    private static readonly DefaultCanvasScale = 1;
    private static readonly DefaultSceneName = 'default';
    private static readonly DefaultTargetFPS = 60;

    private readonly actorMap: { [name: string]: Actor } = {};
    private readonly audioMap: { [name: string]: GameAudio } = {};
    private readonly sceneMap: { [name: string]: Scene } = {};
    private readonly spriteMap: { [name: string]: Sprite } = {};

    private readonly _options: GameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultScene: Scene;
    get defaultScene() { return this._defaultScene; }

    private constructor(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions) {
        this._canvas = canvas;
        this._inputHandler = inputHandler;
        this._options = this.applyGameOptions(options);
        this._defaultScene = this.defineScene(Game.DefaultSceneName, this._options.defaultSceneOptions);
        
    }

    static init(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions): Game {
        return new Game(canvas, inputHandler, options);
    }

    applyGameOptions(options: GameOptions): GameOptions {
        options.targetFPS = options.targetFPS || Game.DefaultTargetFPS;
        options.canvasScale = options.canvasScale || Game.DefaultCanvasScale;
        return options;
    }

    nextActorInstanceID = (() => {
        let currentID = 0;
        return (() => ++currentID);
    })();

    defineActor(actorName: string, options: ActorOptions = {}): Actor {
        if (this.actorMap[actorName]) {
            throw new Error(`Actor defined with existing Actor name: ${actorName}.`);
        }
        
        const actor = Actor.define(actorName, this, options);
        this.actorMap[actorName] = actor;

        return actor;
    }

    getActor(actorName: string): Actor {
        if (!this.actorMap[actorName]) {
            throw new GameError(`Actor retrieved by name that does not exist: ${actorName}.`);
        }

        return this.actorMap[actorName];
    }

    defineScene(sceneName: string, options: SceneOptions = {}): Scene {
        if (this.sceneMap[sceneName]) {
            throw new GameError(`Scene defined with existing Scene name: ${sceneName}.`);
        }

        const scene = Scene.define(sceneName, this, options);
        this.sceneMap[sceneName] = scene;

        return scene;
    }

    getScene(sceneName: string): Scene {
        if (!this.sceneMap[sceneName]) {
            throw new GameError(`Scene retrieved by name that does not exist: ${sceneName}.`);
        }

        return this.sceneMap[sceneName];
    }

    defineAudio(audioName: string, source: string, options?: GameAudioOptions): GameAudio {
        if (this.audioMap[audioName]) {
            throw new GameError(`Audio defined with existing Audio name: ${audioName}.`);
        }

        const audio = GameAudio.fromSource(audioName, source, options);
        this.audioMap[audioName] = audio;

        return audio;
    }

    getAudio(audioName: string): GameAudio {
        if (!this.audioMap[audioName]) {
            throw new GameError(`Audio retrieved by name that does not exist: ${audioName}.`);
        }

        return this.audioMap[audioName];
    }

    defineSprite(spriteName: string, imageSource: string, options: SpriteOptions = {}): Sprite {
        if (this.spriteMap[spriteName]) {
            throw new GameError(`Sprite defined with existing Sprite name: ${spriteName}.`);
        }

        const newSprite = Sprite.fromSource(spriteName, imageSource, options);
        this.spriteMap[spriteName] = newSprite;

        return newSprite;
    }

    getSprite(spriteName: string): Sprite {
        if (!this.spriteMap[spriteName]) {
            throw new GameError(`Sprite retrieved by name that does not exist: ${spriteName}.`);
        }

        return this.spriteMap[spriteName];
    }

    load() {
        const promises: Promise<void | string>[] = [];

        // TODO: add audio loading.

        for (const s in this.spriteMap) {
            const sprite = this.spriteMap[s];
            promises.push(sprite.load());
        }

        return Promise.all(promises).then(() => {
            for (const a in this.actorMap) {
                const actor = this.actorMap[a];
                actor.load();
            }

            return Promise.resolve();
        });
    }

    start(sceneName?: string) {
        const state = new GameController(this);
        state.goToScene(sceneName || Game.DefaultSceneName);
        this.run(state, this.canvas, this.input);
    }

    private run(gc: GameController, canvas: GameCanvas, inputHandler: GameInputHandler) {
        const lifecycle = new GameLifecycle();
        inputHandler.registerPointerInputHandler((ev: PointerInputEvent) => lifecycle.pointerEvent(ev, gc));
        inputHandler.registerKeyboardInputHandler((ev: KeyboardInputEvent) => lifecycle.keyboardEvent(ev, gc));

        let offset: number = 0;
        let previous: number = window.performance.now();
        const stepSize: number = 1 / this.options.targetFPS;

        const gameLoop: FrameRequestCallback = (): void => {
            const current: number = window.performance.now();
            offset += (Math.min(1, (current - previous) / 1000));

            while (offset > stepSize) {
                lifecycle.step(gc);
                offset -= stepSize;
            }

            lifecycle.draw(gc, canvas);
            previous = current;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
