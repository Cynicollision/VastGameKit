import { Actor, ActorOptions } from './../actor';
import { GameCanvas, GameInputHandler } from './../device';
import { GameLifecycle } from './lifecycle';
import { GameState } from './state';
import { Room, RoomOptions } from './../room';
import { Sprite, SpriteOptions } from './../sprite';

export interface GameOptions {
    canvasElementId: string;
    targetFPS?: number;
}

export class GameError extends Error {
    private _innerError: Error;
    get innerError() { return this._innerError; }

    constructor (message: string, innerError?: Error) {
        super(message);
        this._innerError = innerError;
    }
}

export class Game {  
    private static readonly DefaultTargetFPS = 60;
    static readonly DefaultRoomName = 'default';

    private readonly actorRegistry: { [name: string]: Actor } = {};
    private readonly roomRegistry: { [name: string]: Room } = {};
    private readonly spriteRegistry: { [name: string]: Sprite } = {};

    private readonly _options: GameOptions;
    get options() { return this._options; }

    private readonly _canvas: GameCanvas;
    get canvas() { return this._canvas; }

    private readonly _inputHandler: GameInputHandler;
    get input() { return this._inputHandler; }

    private readonly _defaultRoom: Room;
    get defaultRoom() { return this._defaultRoom; }

    constructor(config: GameOptions, canvas: GameCanvas, inputHandler: GameInputHandler) {
        this._options = config;
        this._options.targetFPS = config.targetFPS || Game.DefaultTargetFPS;
        this._canvas = canvas;
        this._inputHandler = inputHandler;
        this._defaultRoom = this.defineRoom(Game.DefaultRoomName);
    }

    nextActorInstanceID = (() => {
        let currentID = 0;
        return (() => ++currentID);
    })();

    defineActor(actorName: string, options: ActorOptions = {}): Actor {
        if (this.actorRegistry[actorName]) {
            throw new Error(`Actor defined with existing Actor name: ${actorName}.`);
        }
        
        const actor = Actor.define(actorName, this, options);
        this.actorRegistry[actorName] = actor;

        return actor;
    }

    getActor(actorName: string): Actor {
        if (!this.actorRegistry[actorName]) {
            throw new GameError(`Actor retrieved by name that does not exist: ${actorName}.`);
        }

        return this.actorRegistry[actorName];
    }

    defineRoom(roomName: string, options: RoomOptions = {}): Room {
        if (this.roomRegistry[roomName]) {
            throw new GameError(`Room defined with existing Event name: ${roomName}.`);
        }

        const room = Room.define(roomName, this, options);
        this.roomRegistry[roomName] = room;

        return room;
    }

    getRoom(roomName: string): Room {
        if (!this.roomRegistry[roomName]) {
            throw new GameError(`Room retrieved by name that does not exist: ${roomName}.`);
        }

        return this.roomRegistry[roomName];
    }

    defineSprite(spriteName: string, imageSource: string, options: SpriteOptions = {}): Sprite {
        if (this.spriteRegistry[spriteName]) {
            throw new GameError(`Sprite defined with existing Event name: ${spriteName}.`);
        }

        const newSprite = Sprite.fromImage(spriteName, imageSource, options);
        this.spriteRegistry[spriteName] = newSprite;

        return newSprite;
    }

    getSprite(spriteName: string): Sprite {
        if (!this.spriteRegistry[spriteName]) {
            throw new GameError(`Sprite retrieved by name that does not exist: ${spriteName}.`);
        }

        return this.spriteRegistry[spriteName];
    }

    load() {
        const promises: Promise<void | string>[] = [];

        for (const s in this.spriteRegistry) {
            const sprite = this.spriteRegistry[s];
            promises.push(sprite.load());
        }

        return Promise.all(promises);
    }

    start(roomName?: string) {
        const state = new GameState(this);
        state.init(roomName || Game.DefaultRoomName);
        this.run(state, this.canvas, this.input);
    }

    private run(state: GameState, canvas: GameCanvas, inputHandler: GameInputHandler) {
        const lifecycle = new GameLifecycle();

        inputHandler.registerPointerInputHandler(event =>{
            lifecycle.pointerEvent(event, state);
        });

        inputHandler.registerKeyboardInputHandler((event: KeyboardEvent) => {
            lifecycle.keyboardEvent(event, state);
        });

        let offset: number = 0;
        let previous: number = window.performance.now();
        const stepSize: number = 1 / this.options.targetFPS;

        const gameLoop: FrameRequestCallback = (): void => {
            const current: number = window.performance.now();
            offset += (Math.min(1, (current - previous) / 1000));

            while (offset > stepSize) {
                lifecycle.step(state);
                offset -= stepSize;
            }

            lifecycle.draw(state, canvas);

            previous = current;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
