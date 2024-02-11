import { ActorInstance } from './actorInstance';
import { ActorInstanceBehaviorName } from './actorInstanceBehavior';
import { Boundary, RectBoundary } from './boundary';
import { Game, GameError, GameEvent, GameState } from './../game';
import { GameCanvas, PointerInputEvent } from './../device';
import { Sprite } from './../sprite';

export interface ActorLifecycleCallback {
    (self: ActorInstance, state: GameState): void;
}

export interface ActorLifecycleEventCallback {
    (self: ActorInstance, state: GameState, event: GameEvent): void;
}

export interface ActorLifecycleDrawCallback {
    (self: ActorInstance, state: GameState, canvas: GameCanvas): void;
}

export interface ActorKeyboardInputCallback {
    (self: ActorInstance, state: GameState, event: KeyboardEvent): void;
}

export interface ActorPointerInputCallback {
    (self: ActorInstance, state: GameState, event: PointerInputEvent): void;
}

export interface ActorOptions {
    boundary?: Boundary;
    solid?: boolean; // TODO implement
    sprite?: Sprite;
}

export class Actor {
    private readonly _game: Game;

    private gameEventHandlerRegistry: { [eventName: string]: ActorLifecycleEventCallback } = {};
    private keyboardInputEventHandlerRegistry: { [type: string]: ActorKeyboardInputCallback } = {};
    private pointerInputEventHandlerRegistry: { [type: string]: ActorPointerInputCallback } = {};

    private _behaviors: ActorInstanceBehaviorName[] = [];
    get behaviors() { return this._behaviors; }

    private onCreateCallback: ActorLifecycleCallback;
    private onStepCallback: ActorLifecycleCallback;
    private onDrawCallback: ActorLifecycleDrawCallback;
    private onDestroyCallback: ActorLifecycleCallback;

    private readonly _name: string;
    get name() { return this._name; }

    private _boundary: Boundary;
    get boundary() { return this._boundary; }

    sprite: Sprite;

    static define(name: string, game: Game, options?: ActorOptions): Actor {
        const actor = new Actor(name, game, options || {});

        return actor;
    }

    private constructor(name: string, game: Game, options: ActorOptions) {
        this._name = name;
        this._game = game;
        this._boundary = options.boundary;
        this.sprite = options.sprite;
    }

    // TODO onCollision(actorName, callback)

    setBoundaryFromSprite(sprite?: Sprite): RectBoundary {
        sprite = sprite || this.sprite;
        
        if (!sprite) {
            throw new GameError(`Actor ${this.name} attempting to set a Boundary from a null Sprite.`);
        }

        if (!sprite.loaded) {
            //throw new GameError(`Attempting to set boundary from Sprite ${sprite.name} which has not yet been loaded.`);
        }
        
        const boundary = RectBoundary.fromSprite(sprite);
        this._boundary = boundary;

        return boundary;
    }

    useBehavior(behaviorName: ActorInstanceBehaviorName): void {
        if (this._behaviors[behaviorName]) {
            throw new GameError(`Actor ${this.name} is alreadying using Behavior ${behaviorName}.`)
        }

        this._behaviors.push(behaviorName);
    }

    onCreate(callback: ActorLifecycleCallback): void {
        this.onCreateCallback = callback;
    }

    callCreate(self: ActorInstance, state: GameState): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(self, state);
        }
    }

    onGameEvent(eventName: string, callback: ActorLifecycleEventCallback): void {
        this.gameEventHandlerRegistry[eventName] = callback;
    }

    callEvent(self: ActorInstance, state: GameState, event: GameEvent): void {
        if (!event.isCanelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](self, state, event);
            }
        }
    }

    onPointerInput(type: string, callback: ActorPointerInputCallback): void {
        this.pointerInputEventHandlerRegistry[type] = callback;
    }

    callPointerInput(self: ActorInstance, state: GameState, event: PointerInputEvent): void {
        const handler: ActorPointerInputCallback = this.pointerInputEventHandlerRegistry[event.type];
        if (handler) {
            handler(self, state, event);
        }
    }

    onKeyboardInput(key: string, callback: ActorKeyboardInputCallback): void {
        this.keyboardInputEventHandlerRegistry[key] = callback;
    }

    callKeyboardInput(self: ActorInstance, state: GameState, event: KeyboardEvent): void {
        const handler: ActorKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[event.key];
        if (handler) {
            handler(self, state, event);
        }
    }

    onStep(callback: ActorLifecycleCallback): void {
        this.onStepCallback = callback;
    }

    callStep(self: ActorInstance, state: GameState): void {
        if (this.onStepCallback) {
            this.onStepCallback(self, state);
        }
    }

    onDraw(callback: ActorLifecycleDrawCallback): void {
        this.onDrawCallback = callback;
    }

    callDraw(self: ActorInstance, state: GameState, canvas: GameCanvas): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(self, state, canvas);
        }
    }
    
    onDestroy(callback: ActorLifecycleCallback): void {
        this.onDestroyCallback = callback;
    }

    callDestroy(self: ActorInstance, state: GameState): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(self, state);
        }
    }
}
