import { ActorBehaviorName } from './../core/enum';
import { GameError } from './../core/error';
import { Game } from './../game';
import { SceneController } from './../scene/controller';
import { EntityLifecycleCb, LifecycleEntityBase } from './../scene/entity';
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

export interface ActorDefinition extends LifecycleEntityBase<ActorDefinition, ActorInstance> {
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

export class Actor extends LifecycleEntityBase<ActorDefinition, ActorInstance> implements ActorDefinition {
    private onCreateCallback: EntityLifecycleCb<ActorInstance>;
    private onDestroyCallback: EntityLifecycleCb<ActorInstance>;

    private collisionHandlerRegistry: { [actorName: string]: ActorLifecycleCollisionCallback } = {};

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
        super();
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

    getCollisionActorNames(): string[] {
        const actorNames = [];

        for (const name in this.collisionHandlerRegistry) {
            actorNames.push(name);
        }

        return actorNames;
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