import { ActorBehaviorName, Boundary, GameError, ObjMap, RuntimeID } from './../core';
import { CircleBoundary, RectBoundary } from './../core/boundaries';
import { Sprite } from './../resources/sprite';
import { Controller } from './../state/controller';
import { ActorInstance, ActorInstanceOptions, Instance } from './../state/instance';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';

export type ActorBehavior = {
    beforeStep?: EntityLifecycleCb<Instance>;
    afterStep?: EntityLifecycleCb<Instance>;
};

export type ActorOptions = {
    boundary?: Boundary;
    solid?: boolean;
    sprite?: Sprite;
};

type ActorLifecycleCollisionCallback = {
    (self: Instance, other: Instance, controller: Controller): void;
};

export interface Actor extends LifecycleEntityBase<Actor, Instance> {
    readonly name: string;
    readonly behaviors: ActorBehaviorName[];
    readonly boundary: Boundary;
    sprite: Sprite;
    solid: boolean;
    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): void;
    onCreate(callback: EntityLifecycleCb<Instance>): void;
    onDestroy(callback: EntityLifecycleCb<Instance>): void;
    setCircleBoundary(radius: number, originX: number, originY: number): CircleBoundary;
    setCircleBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): CircleBoundary;
    setRectBoundary(width: number, height: number, originX?: number, originY?: number): RectBoundary
    setRectBoundaryFromSprite(sprite?: Sprite, originX?: number, originY?: number): RectBoundary;
    useBasicMotionBehavior(): Actor;
    useBehavior(behaviorName: ActorBehaviorName): Actor;
}

export class ActorDefinition extends LifecycleEntityBase<Actor, Instance> implements Actor {
    private onCreateCallback: EntityLifecycleCb<Instance>;
    private onDestroyCallback: EntityLifecycleCb<Instance>;

    private collisionHandlerRegistry: ObjMap<ActorLifecycleCollisionCallback> = {};

    readonly name: string;
    solid: boolean;
    sprite: Sprite;

    private _behaviors: ActorBehaviorName[] = [];
    get behaviors() { return this._behaviors; }

    private _boundary: Boundary;
    get boundary() { return this._boundary; }

    static new(name: string, options: ActorOptions = {}): ActorDefinition {
        return new ActorDefinition(name, options);
    }

    private constructor(name: string, options: ActorOptions) {
        super();
        this.name = name;
        this._boundary = options.boundary;
        this.solid = options.solid || false;
        this.sprite = options.sprite;
    }

    callCollision(self: Instance, other: Instance, controller: Controller): void {
        if (this.collisionHandlerRegistry[other.actor.name]) {
            this.collisionHandlerRegistry[other.actor.name](self, other, controller);
        }
    }

    callCreate(self: Instance, controller: Controller): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(self, controller);
        }
    }

    callDestroy(self: Instance, controller: Controller): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(self, controller);
        }
    }

    getCollisionActorNames(): string[] {
        const actorNames = [];

        for (const name in this.collisionHandlerRegistry) {
            actorNames.push(name);
        }

        return actorNames;
    }

    newInstance(options: ActorInstanceOptions = {}): ActorInstance {
        return new ActorInstance(RuntimeID.next(), this, options);
    }

    onCreate(callback: EntityLifecycleCb<Instance>): void {
        this.onCreateCallback = callback;
    }

    onCollision(actorName: string, callback: ActorLifecycleCollisionCallback): void {
        if (this.collisionHandlerRegistry[actorName]) {
            throw new GameError(`Actor ${this.name} already has a collision handler for Actor ${actorName}.`)
        }

        this.collisionHandlerRegistry[actorName] = callback;
    }

    onDestroy(callback:  EntityLifecycleCb<Instance>): void {
        this.onDestroyCallback = callback;
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