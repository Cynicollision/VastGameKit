import { ActorBehaviorName } from './../core/enum';
import { GameError } from './../core/error';
import { GameEvent, KeyboardInputEvent, PointerInputEvent } from './../core/events';
import { GameCanvas } from './../device/canvas';
import { Game } from './../game';
import { SceneController } from './../scene/controller';
import { EntityLifecycleKeyboardEventCb, EntityLifecycleCb, LifecycleEntity, EntityLifecycleGameEventCb, EntityLifecyclePointerEventCb, EntityLifecycleDrawCb } from './../scene/entity';
import { Sprite } from './../sprite/sprite';
import { CircleBoundary } from './boundaries/circleBoundary';
import { RectBoundary } from './boundaries/rectangleBoundary';
import { Boundary } from './boundary';
import { ActorInstance } from './instance';

export type ActorBehavior = {
    beforeStep?: EntityLifecycleCb<ActorInstance>;
    afterStep?: EntityLifecycleCb<ActorInstance>;
};

export type ActorOptions = {
    boundary?: Boundary;
    solid?: boolean;
    sprite?: Sprite;
};

type ActorLifecycleCollisionCallback = {
    (self: ActorInstance, other: ActorInstance, sc: SceneController): void;
};

export interface ActorDefinition extends LifecycleEntity<ActorDefinition, ActorInstance> {
    name: string;
    behaviors: ActorBehaviorName[];
    boundary: Boundary;
    game: Game;
    sprite: Sprite;
    solid: boolean;
    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): ActorDefinition;
    onCreate(callback: EntityLifecycleCb<ActorInstance>): ActorDefinition;
    onDestroy(callback: EntityLifecycleCb<ActorInstance>): ActorDefinition;
    setCircleBoundary(radius: number, originX: number, originY: number): CircleBoundary;
    setCircleBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): CircleBoundary;
    setRectBoundary(height: number, width: number, originX?: number, originY?: number): RectBoundary
    setRectBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): RectBoundary;
    useBasicMotionBehavior(): ActorDefinition;
    useBehavior(behaviorName: ActorBehaviorName): ActorDefinition;
}

export class Actor implements ActorDefinition {
    private collisionHandlerRegistry: { [actorName: string]: ActorLifecycleCollisionCallback } = {};
    private gameEventHandlerRegistry: { [eventName: string]: EntityLifecycleGameEventCb<ActorInstance> } = {};
    private keyboardInputEventHandlerRegistry: { [type: string]: EntityLifecycleKeyboardEventCb<ActorInstance> } = {};
    private pointerInputEventHandlerRegistry: { [type: string]: EntityLifecyclePointerEventCb<ActorInstance> } = {};

    private onLoadCallback: (actor: ActorDefinition) => void;
    private onCreateCallback: EntityLifecycleCb<ActorInstance>;
    private onStepCallback: EntityLifecycleCb<ActorInstance>;
    private onDrawCallback: EntityLifecycleDrawCb<ActorInstance>;
    private onDestroyCallback: EntityLifecycleCb<ActorInstance>;

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
        if (this.gameEventHandlerRegistry[event.name]) {
            this.gameEventHandlerRegistry[event.name](self, event, sc);
        }
    }

    callKeyboardEvent(self: ActorInstance, event: KeyboardInputEvent, sc: SceneController): void {
        if (this.keyboardInputEventHandlerRegistry[event.key]) {
            this.keyboardInputEventHandlerRegistry[event.key](self, event, sc);
        }
    }

    callPointerEvent(self: ActorInstance, event: PointerInputEvent, sc: SceneController): void {
        if (this.pointerInputEventHandlerRegistry[event.type]) {
            this.pointerInputEventHandlerRegistry[event.type](self, event, sc);
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

    onCreate(callback: EntityLifecycleCb<ActorInstance>): ActorDefinition {
        this.onCreateCallback = callback;
        return this;
    }

    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): ActorDefinition {
        if (this.collisionHandlerRegistry[actorName]) {
            throw new GameError(`Actor ${this.name} already has a collision handler for Actor ${actorName}.`)
        }

        this.collisionHandlerRegistry[actorName] = callback;
        return <ActorDefinition>this;
    }

    onDestroy(callback:  EntityLifecycleCb<ActorInstance>): ActorDefinition {
        this.onDestroyCallback = callback;
        return this;
    }

    onDraw(callback: EntityLifecycleDrawCb<ActorInstance>): ActorDefinition {
        this.onDrawCallback = callback;
        return this;
    }

    onGameEvent(eventName: string, callback: EntityLifecycleGameEventCb<ActorInstance>): ActorDefinition {
        this.gameEventHandlerRegistry[eventName] = callback;
        return this;
    }

    onKeyboardInput(key: string, callback: EntityLifecycleKeyboardEventCb<ActorInstance>): ActorDefinition {
        this.keyboardInputEventHandlerRegistry[key] = callback;
        return this;
    }

    onPointerInput(type: string, callback: EntityLifecyclePointerEventCb<ActorInstance>): ActorDefinition {
        this.pointerInputEventHandlerRegistry[type] = callback;
        return this;
    }

    onStep(callback:  EntityLifecycleCb<ActorInstance>): ActorDefinition {
        this.onStepCallback = callback;
        return this;
    }

    onLoad(callback: (actor: ActorDefinition) => void): ActorDefinition {
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

    useBasicMotionBehavior(): ActorDefinition {
        return this.useBehavior(ActorBehaviorName.BasicMotion);
    }

    useBehavior(behaviorName: ActorBehaviorName): ActorDefinition {
        if (this._behaviors[behaviorName]) {
            throw new GameError(`Actor ${this.name} is alreadying using Behavior ${behaviorName}.`)
        }

        this._behaviors.push(behaviorName);
        return this;
    }
}