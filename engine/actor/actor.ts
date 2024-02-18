import { ActorInstance } from './actorInstance';
import { ActorInstanceBehaviorName } from './actorInstanceBehavior';
import { Boundary, CircleBoundary, RectBoundary } from './boundary';
import { Game, GameError, GameEvent, GameState } from './../game';
import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { Sprite } from './../sprite';

export type ActorOptions = {
    boundary?: Boundary;
    solid?: boolean;
    sprite?: Sprite;
};

export type ActorLifecycleCallback = {
    (self: ActorInstance, state: GameState): void;
};

export type ActorLifecycleCollisionCallback = {
    (self: ActorInstance, other: ActorInstance, state: GameState): void;
};

export type ActorLifecycleEventCallback = {
    (self: ActorInstance, state: GameState, event: GameEvent): void;
};

export type ActorKeyboardInputCallback = {
    (self: ActorInstance, state: GameState, event: KeyboardInputEvent): void;
};

export type ActorPointerInputCallback = {
    (self: ActorInstance, state: GameState, event: PointerInputEvent): void;
};

export type ActorLifecycleDrawCallback = {
    (self: ActorInstance, state: GameState, canvas: GameCanvas): void;
};

export class Actor {
    private collisionHandlerRegistry: { [actorName: string]: ActorLifecycleCollisionCallback } = {};
    private gameEventHandlerRegistry: { [eventName: string]: ActorLifecycleEventCallback } = {};
    private keyboardInputEventHandlerRegistry: { [type: string]: ActorKeyboardInputCallback } = {};
    private pointerInputEventHandlerRegistry: { [type: string]: ActorPointerInputCallback } = {};

    private onLoadCallback: (actor: Actor) => void;
    private onCreateCallback: ActorLifecycleCallback;
    private onStepCallback: ActorLifecycleCallback;
    private onDrawCallback: ActorLifecycleDrawCallback;
    private onDestroyCallback: ActorLifecycleCallback;

    readonly name: string;
    readonly game: Game;
    solid: boolean;
    sprite: Sprite;

    private _behaviors: ActorInstanceBehaviorName[] = [];
    get behaviors() { return this._behaviors; }

    private _boundary: Boundary;
    get boundary() { return this._boundary; }

    static define(name: string, game: Game, options: ActorOptions = {}): Actor {
        return new Actor(name, game, options);
    }

    private constructor(name: string, game: Game, options: ActorOptions) {
        this.name = name;
        this.game = game;
        this._boundary = options.boundary;
        this.solid = options.solid || false;
        this.sprite = options.sprite;
    }

    setCircleBoundary(radius: number, originX: number = 0, originY: number = 0): CircleBoundary {
        const boundary = new CircleBoundary(radius, originX, originY);
        this._boundary = boundary;

        return boundary;
    }

    setCircleBoundaryFromSprite(sprite?: Sprite, originX: number = 0, originY: number = 0): CircleBoundary {
        sprite = sprite || this.sprite;

        if (!sprite) {
            throw new GameError(`Actor ${this.name} attempting to set a CircleBoundary from a null Sprite.`);
        }

        const boundary = CircleBoundary.fromSprite(sprite, originX, originY);
        this._boundary = boundary;

        return boundary;
    }

    setRectBoundary(height: number, width: number, originX: number = 0, originY: number = 0): RectBoundary {
        const boundary = new RectBoundary(height, width, originX, originY);
        this._boundary = boundary;
        
        return boundary;
    }

    setRectBoundaryFromSprite(sprite?: Sprite, originX: number = 0, originY: number = 0): RectBoundary {
        sprite = sprite || this.sprite;
        
        if (!sprite) {
            throw new GameError(`Actor ${this.name} attempting to set a RectBoundary from a null Sprite.`);
        }

        const boundary = RectBoundary.fromSprite(sprite, originX, originY);
        this._boundary = boundary;

        return boundary;
    }

    useBasicMotionBehavior(): Actor {
        return this.useBehavior(ActorInstanceBehaviorName.BasicMotion);
    }

    useBehavior(behaviorName: ActorInstanceBehaviorName): Actor {
        if (this._behaviors[behaviorName]) {
            throw new GameError(`Actor ${this.name} is alreadying using Behavior ${behaviorName}.`)
        }

        this._behaviors.push(behaviorName);
        return this;
    }

    onLoad(callback: (actor: Actor) => void): Actor {
        this.onLoadCallback = callback;
        return this;
    }

    load(): void {
        if (this.onLoadCallback) {
            this.onLoadCallback(this);
        }
    }

    onCreate(callback: ActorLifecycleCallback): Actor {
        this.onCreateCallback = callback;
        return this;
    }

    callCreate(self: ActorInstance, state: GameState): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(self, state);
        }
    }

    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): Actor {
        if (this.collisionHandlerRegistry[actorName]) {
            throw new GameError(`Actor ${this.name} already has a collision handler for Actor ${actorName}.`)
        }

        this.collisionHandlerRegistry[actorName] = callback;
        return this;
    }

    getCollisionActorNames(): string[] {
        const actorNames = [];

        for (const name in this.collisionHandlerRegistry) {
            actorNames.push(name);
        }

        return actorNames;
    }

    callCollision(self: ActorInstance, other: ActorInstance, state: GameState): void {
        if (this.collisionHandlerRegistry[other.actor.name]) {
            this.collisionHandlerRegistry[other.actor.name](self, other, state);
        }
    }

    onGameEvent(eventName: string, callback: ActorLifecycleEventCallback): Actor {
        this.gameEventHandlerRegistry[eventName] = callback;
        return this;
    }

    callGameEvent(self: ActorInstance, state: GameState, event: GameEvent): void {
        if (!event.isCancelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](self, state, event);
            }
        }
    }

    onKeyboardInput(key: string, callback: ActorKeyboardInputCallback): Actor {
        this.keyboardInputEventHandlerRegistry[key] = callback;
        return this;
    }

    callKeyboardInput(self: ActorInstance, state: GameState, event: KeyboardInputEvent): void {
        const handler: ActorKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[event.key];
        if (handler) {
            handler(self, state, event);
        }
    }

    onPointerInput(type: string, callback: ActorPointerInputCallback): Actor {
        this.pointerInputEventHandlerRegistry[type] = callback;
        return this;
    }

    callPointerInput(self: ActorInstance, state: GameState, event: PointerInputEvent): void {
        if (!event.isCancelled) {
            const handler: ActorPointerInputCallback = this.pointerInputEventHandlerRegistry[event.type];
            if (handler) {
                handler(self, state, event);
            }
        }
    }

    onStep(callback: ActorLifecycleCallback): Actor {
        this.onStepCallback = callback;
        return this;
    }

    callStep(self: ActorInstance, state: GameState): void {
        if (this.onStepCallback) {
            this.onStepCallback(self, state);
        }
    }

    onDraw(callback: ActorLifecycleDrawCallback): Actor {
        this.onDrawCallback = callback;
        return this;
    }

    callDraw(self: ActorInstance, state: GameState, canvas: GameCanvas): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(self, state, canvas);
        }
    }
    
    onDestroy(callback: ActorLifecycleCallback): Actor {
        this.onDestroyCallback = callback;
        return this;
    }

    callDestroy(self: ActorInstance, state: GameState): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(self, state);
        }
    }
}
