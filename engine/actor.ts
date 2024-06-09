import { ActorBehaviorName, Boundary, GameError, ObjMap } from './core';
import { CircleBoundary, RectBoundary } from './core/boundaries';
import { ActorInstance } from './actorInstance';
import { SceneController } from './controller';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';
import { Sprite } from './sprite';

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

// TODO rename -> Actor
export interface ActorDefinition extends LifecycleEntityBase<ActorDefinition, ActorInstance> {
    readonly name: string;
    readonly behaviors: ActorBehaviorName[];
    readonly boundary: Boundary;
    sprite: Sprite;
    solid: boolean;
    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): void;
    onCreate(callback: EntityLifecycleCb<ActorInstance>): void;
    onDestroy(callback: EntityLifecycleCb<ActorInstance>): void;
    onLoad(callback: (scene: ActorDefinition) => void);
    setCircleBoundary(radius: number, originX: number, originY: number): CircleBoundary;
    setCircleBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): CircleBoundary;
    setRectBoundary(width: number, height: number, originX?: number, originY?: number): RectBoundary
    setRectBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): RectBoundary;
    useBasicMotionBehavior(): ActorDefinition;
    useBehavior(behaviorName: ActorBehaviorName): ActorDefinition;
}

// TODO rename -> ActorDefinition
export class Actor extends LifecycleEntityBase<ActorDefinition, ActorInstance> implements ActorDefinition {
    private onCreateCallback: EntityLifecycleCb<ActorInstance>;
    private onDestroyCallback: EntityLifecycleCb<ActorInstance>;
    private onLoadCallback: (self: Actor) => void;

    private collisionHandlerRegistry: ObjMap<ActorLifecycleCollisionCallback> = {};

    readonly name: string;
    solid: boolean;
    sprite: Sprite;

    private _behaviors: ActorBehaviorName[] = [];
    get behaviors() { return this._behaviors; }

    private _boundary: Boundary;
    get boundary() { return this._boundary; }

    static new(name: string, options: ActorOptions = {}): ActorDefinition {
        return new Actor(name, options);
    }

    private constructor(name: string, options: ActorOptions) {
        super();
        this.name = name;
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

    onCreate(callback: EntityLifecycleCb<ActorInstance>): void {
        this.onCreateCallback = callback;
    }

    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): void {
        if (this.collisionHandlerRegistry[actorName]) {
            throw new GameError(`Actor ${this.name} already has a collision handler for Actor ${actorName}.`)
        }

        this.collisionHandlerRegistry[actorName] = callback;
    }

    onDestroy(callback:  EntityLifecycleCb<ActorInstance>): void {
        this.onDestroyCallback = callback;
    }

    onLoad(callback: (actor: ActorDefinition) => void): void {
        this.onLoadCallback = callback;
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

    setRectBoundary(width: number, height: number, originX: number = 0, originY: number = 0): RectBoundary {
        const boundary = new RectBoundary(width, height, originX, originY);
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