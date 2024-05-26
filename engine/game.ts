import { Actor, ActorDefinition, ActorOptions } from './actor/actor';
import { GameError } from './core/error';
import { GameAudio, GameAudioOptions } from './device/audio';
import { GameCanvas } from './device/canvas';
import { GameInputHandler } from './device/input';
import { Controller, SceneController } from './scene/controller';
import { Scene, SceneDefinition, SceneOptions } from './scene/scene';
import { Sprite, SpriteOptions } from './sprite/sprite';

export type GameOptions = {
    canvasElementId: string;
    targetFPS?: number;
    defaultSceneOptions?: SceneOptions;
};

export class Game {  
    private static readonly DefaultSceneName = 'default';
    private static readonly DefaultTargetFPS = 60;

    private readonly actorMap: { [name: string]: Actor } = {};
    private readonly audioMap: { [name: string]: GameAudio } = {};
    private readonly sceneMap: { [name: string]: Scene } = {};
    private readonly spriteMap: { [name: string]: Sprite } = {};

    private readonly _controller: Controller;
    get controller(): SceneController { return this._controller;}

    private readonly _options: GameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultScene: Scene;
    get defaultScene(): SceneDefinition { return this._defaultScene; }

    static init(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions): Game {
        return new Game(canvas, inputHandler, options);
    }

    private constructor(canvas: GameCanvas, inputHandler: GameInputHandler, options: GameOptions) {
        this._canvas = canvas;
        this._inputHandler = inputHandler;
        this._options = this.applyGameOptions(options);
        this._defaultScene = this.defineScene(Game.DefaultSceneName, this._options.defaultSceneOptions);
        this._controller = new Controller(this, this._defaultScene);
    }

    private applyGameOptions(options: GameOptions): GameOptions {
        options.targetFPS = options.targetFPS || Game.DefaultTargetFPS;
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

    defineAudio(audioName: string, source: string, options?: GameAudioOptions): GameAudio {
        if (this.audioMap[audioName]) {
            throw new GameError(`Audio defined with existing Audio name: ${audioName}.`);
        }

        const audio = GameAudio.fromSource(audioName, source, options);
        this.audioMap[audioName] = audio;

        return audio;
    }

    defineScene(sceneName: string, options: SceneOptions = {}): Scene {
        if (this.sceneMap[sceneName]) {
            throw new GameError(`Scene defined with existing Scene name: ${sceneName}.`);
        }

        const scene = <Scene>Scene.define(sceneName, this, options);
        this.sceneMap[sceneName] = scene;

        return scene;
    }

    defineSprite(spriteName: string, imageSource: string, options: SpriteOptions = {}): Sprite {
        if (this.spriteMap[spriteName]) {
            throw new GameError(`Sprite defined with existing Sprite name: ${spriteName}.`);
        }

        const newSprite = Sprite.fromSource(spriteName, imageSource, options);
        this.spriteMap[spriteName] = newSprite;

        return newSprite;
    }

    getActor(actorName: string): ActorDefinition {
        if (!this.actorMap[actorName]) {
            throw new GameError(`Actor retrieved by name that does not exist: ${actorName}.`);
        }

        return this.actorMap[actorName];
    }

    getAudio(audioName: string): GameAudio {
        if (!this.audioMap[audioName]) {
            throw new GameError(`Audio retrieved by name that does not exist: ${audioName}.`);
        }

        return this.audioMap[audioName];
    }

    getScene(sceneName: string): SceneDefinition {
        if (!this.sceneMap[sceneName]) {
            throw new GameError(`Scene retrieved by name that does not exist: ${sceneName}.`);
        }

        return this.sceneMap[sceneName];
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

    start() {
        // TODO: track whether started previously, skip rest(?) to prevent "improper restart"
        this._inputHandler.keyboard.subscribe(ev => this._controller.onKeyboardEvent(ev));
        this._inputHandler.pointer.subscribe(ev => this._controller.onPointerEvent(ev));

        let offset = 0;
        let previous = window.performance.now();
        const stepSize = 1 / this.options.targetFPS;

        const gameLoop: FrameRequestCallback = (): void => {
            const current = window.performance.now();
            offset += (Math.min(1, (current - previous) / 1000));

            while (offset > stepSize) {
                this._controller.step();
                offset -= stepSize;
            }

            this._controller.draw(this._canvas);
            previous = current;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}