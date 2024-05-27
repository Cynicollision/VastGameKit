import { ActorBehaviorName } from './../core/enum';
import { GameError } from './../core/error';
import { GameEvent } from './../core/event';
import { GameCanvas } from './../device/canvas';
import { KeyboardInputEvent } from './../device/keyboard';
import { PointerInputEvent } from './../device/pointer';
import { Game } from './../game';
import { SceneController } from './../scene/controller';
import { Sprite } from './../sprite/sprite';
import { CircleBoundary } from './boundaries/circleBoundary';
import { RectBoundary } from './boundaries/rectangleBoundary';
import { Boundary } from './boundary';
import { ActorInstance } from './instance';

export type ActorBehavior = {
    beforeStep?: ActorLifecycleCallback;
    afterStep?: ActorLifecycleCallback;
};

export type ActorOptions = {
    boundary?: Boundary;
    solid?: boolean;
    sprite?: Sprite;
};

// TODO do these NEED to be exported?
export type ActorLifecycleCallback = {
    (self: ActorInstance, sc: SceneController): void;
};

export type ActorLifecycleCollisionCallback = {
    (self: ActorInstance, other: ActorInstance, sc: SceneController): void;
};

export type ActorLifecycleDrawCallback = {
    (self: ActorInstance, canvas: GameCanvas, sc: SceneController): void;
};

export type ActorLifecycleEventCallback = {
    (self: ActorInstance, event: GameEvent, sc: SceneController): void;
};

export type ActorKeyboardInputCallback = {
    (self: ActorInstance, event: KeyboardInputEvent, sc: SceneController): void;
};

export type ActorPointerInputCallback = {
    (self: ActorInstance, event: PointerInputEvent, sc: SceneController): void;
};

export interface ActorDefinition {
    name: string;
    behaviors: ActorBehaviorName[];
    boundary: Boundary;
    game: Game;
    sprite: Sprite;
    solid: boolean;
    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): ActorDefinition;
    onCreate(callback: ActorLifecycleCallback): ActorDefinition;
    onDestroy(callback: ActorLifecycleCallback): ActorDefinition;
    onDraw(callback: ActorLifecycleDrawCallback): ActorDefinition;
    onGameEvent(eventName: string, callback: ActorLifecycleEventCallback): ActorDefinition;
    onKeyboardInput(key: string, callback: ActorKeyboardInputCallback): ActorDefinition;
    onPointerInput(type: string, callback: ActorPointerInputCallback): ActorDefinition;
    onStep(callback: ActorLifecycleCallback): ActorDefinition;
    onLoad(callback: (actor: ActorDefinition) => void): ActorDefinition;
    setCircleBoundary(radius: number, originX: number, originY: number): CircleBoundary;
    setCircleBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): CircleBoundary;
    setRectBoundary(height: number, width: number, originX?: number, originY?: number): RectBoundary
    setRectBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): RectBoundary;
    useBasicMotionBehavior(): ActorDefinition;
    useBehavior(behaviorName: ActorBehaviorName): ActorDefinition;
}

export class Actor implements ActorDefinition {
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

    private _behaviors: ActorBehaviorName[] = [];
    get behaviors() { return this._behaviors; }

    private _boundary: Boundary;
    get boundary() { return this._boundary; }

    static define(name: string, game: Game, options: ActorOptions = {}): ActorDefinition {
        return new Actor(name, game, options);
    }

    private constructor(name: string, game: Game, options: ActorOptions) {
        this.name = name;
        this.game = game;
        this._boundary = options.boundary;
        this.solid = options.solid || false;
        this.sprite = options.sprite;
    }

    callCollision(self: ActorInstance, other: ActorInstance, sc: SceneController): void {
        if (this.collisionHandlerRegistry[other.actor.name]) {
            this.collisionHandlerRegistry[other.actor.name](self, other, sc);
        }
    }

    callCreate(self: ActorInstance, sc: SceneController): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(self, sc);
        }
    }

    callDestroy(self: ActorInstance, sc: SceneController): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(self, sc);
        }
    }

    callDraw(self: ActorInstance, canvas: GameCanvas, sc: SceneController): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(self, canvas, sc);
        }
    }

    callGameEvent(self: ActorInstance, event: GameEvent, sc: SceneController): void {
        if (!event.isCancelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](self, event, sc);
            }
        }
    }

    callKeyboardInput(self: ActorInstance, event: KeyboardInputEvent, sc: SceneController): void {
        const handler: ActorKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[event.key];
        if (handler) {
            handler(self, event, sc);
        }
    }

    callPointerInput(self: ActorInstance, event: PointerInputEvent, sc: SceneController): void {
        if (!event.isCancelled) {
            const handler: ActorPointerInputCallback = this.pointerInputEventHandlerRegistry[event.type];
            if (handler) {
                handler(self, event, sc);
            }
        }
    }

    callStep(self: ActorInstance, sc: SceneController): void {
        if (this.onStepCallback) {
            this.onStepCallback(self, sc);
        }
    }

    getCollisionActorNames(): string[] {
        const actorNames = [];

        for (const name in this.collisionHandlerRegistry) {
            actorNames.push(name);
        }

        return actorNames;
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

    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): Actor {
        if (this.collisionHandlerRegistry[actorName]) {
            throw new GameError(`Actor ${this.name} already has a collision handler for Actor ${actorName}.`)
        }

        this.collisionHandlerRegistry[actorName] = callback;
        return this;
    }

    onDestroy(callback: ActorLifecycleCallback): Actor {
        this.onDestroyCallback = callback;
        return this;
    }

    onDraw(callback: ActorLifecycleDrawCallback): Actor {
        this.onDrawCallback = callback;
        return this;
    }

    onGameEvent(eventName: string, callback: ActorLifecycleEventCallback): Actor {
        this.gameEventHandlerRegistry[eventName] = callback;
        return this;
    }

    onKeyboardInput(key: string, callback: ActorKeyboardInputCallback): Actor {
        this.keyboardInputEventHandlerRegistry[key] = callback;
        return this;
    }

    onPointerInput(type: string, callback: ActorPointerInputCallback): Actor {
        this.pointerInputEventHandlerRegistry[type] = callback;
        return this;
    }

    onStep(callback: ActorLifecycleCallback): Actor {
        this.onStepCallback = callback;
        return this;
    }

    onLoad(callback: (actor: ActorDefinition) => void): Actor {
        this.onLoadCallback = callback;
        return this;
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
        return this.useBehavior(ActorBehaviorName.BasicMotion);
    }

    useBehavior(behaviorName: ActorBehaviorName): Actor {
        if (this._behaviors[behaviorName]) {
            throw new GameError(`Actor ${this.name} is alreadying using Behavior ${behaviorName}.`)
        }

        this._behaviors.push(behaviorName);
        return this;
    }
}