import { GameError, GameEvent, Geometry, InstanceStatus, KeyboardInputEvent, ObjMap, PointerInputEvent } from './../core';
import { GameCanvas } from './../device/canvas';
import { SpriteAnimation } from './../resources/spriteAnimation';
import { ActorDefinition, Actor } from './../structure/actor';
import { FollowEntityOptions, PositionedEntity } from './../structure/entity';
import { Controller } from './controller';
import type { SceneInstanceState } from './instanceState';

export type ActorInstanceOptions = {
    depth?: number;
    x?: number;
    y?: number;
};

// Moves an Instance each step by speed, in direction degrees (see Direction). Movement stops short of solid Instances.
export type InstanceMotion = {
    direction: number;
    speed: number;
};

export interface Instance extends PositionedEntity {
    readonly id: number;
    readonly animation: SpriteAnimation;
    readonly actor: Actor;
    readonly motion: InstanceMotion;
    readonly state: ObjMap<any>;
    readonly status: InstanceStatus;
    depth: number;
    x: number;
    y: number;
    activate(): void;
    collidesWith(other: Instance): boolean;
    destroy(): void;
    follow(target: PositionedEntity, options?: FollowEntityOptions): void;
    inactivate(): void;
}

export class ActorInstance implements Instance {
    // the Scene's instances this Instance belongs to, used for movement and collisions.
    private readonly instances: SceneInstanceState;
    private _followTarget?: PositionedEntity;
    private _followOptions: Required<FollowEntityOptions> = { centerOnTarget: false, offsetX: 0, offsetY: 0 };

    readonly id: number;
    readonly actor: ActorDefinition;
    readonly motion: InstanceMotion = { direction: 0, speed: 0 };
    readonly state: ObjMap<any> = {};

    private _animation?: SpriteAnimation;
    get animation(): SpriteAnimation {
        if (!this._animation) {
            throw new GameError(`Instance of Actor ${this.actor.name} has no animation because the Actor has no Sprite.`);
        }
        return this._animation;
    }

    private _status: InstanceStatus;
    get status() { return this._status; }

    depth: number = 0;
    x: number = 0;
    y: number = 0;

    get height(): number {
        return this.actor.boundary ? this.actor.boundary.height : 0;
    }

    get width(): number {
        return this.actor.boundary ? this.actor.boundary.width : 0;
    }

    constructor(id: number, actor: ActorDefinition, instances: SceneInstanceState, options: ActorInstanceOptions = {}) {
        this.id = id;
        this.actor = actor;
        this.instances = instances;
        this._status = InstanceStatus.New;

        this.depth = options.depth !== undefined ? options.depth : 0;
        this.x = options.x !== undefined ? options.x : 0;
        this.y = options.y !== undefined ? options.y : 0;

        if (actor.sprite) {
            this._animation = actor.sprite.newAnimation();
        }
    }

    // Returns the furthest distance, up to the given distance, that can be moved along one axis.
    private static getAllowedDistance(distance: number, isFree: (distance: number) => boolean): number {
        if (distance === 0 || isFree(distance)) {
            return distance;
        }

        const sign = Math.sign(distance);
        let allowed = 0;

        for (let tryDistance = sign; Math.abs(tryDistance) < Math.abs(distance); tryDistance += sign) {
            if (!isFree(tryDistance)) {
                break;
            }
            allowed = tryDistance;
        }

        return allowed;
    }

    private checkCollisions(controller: Controller): void {
        for (const actorName of this.actor.getCollisionActorNames()) {
            for (const other of this.instances.getAll(actorName)) {
                if (this._status !== InstanceStatus.Active) {
                    return;
                }

                if (other !== this && other.status === InstanceStatus.Active && this.collidesWith(other)) {
                    this.actor.callCollision(this, other, controller);
                }
            }
        }
    }

    private move(): void {
        if (this.motion.speed === 0) {
            return;
        }

        const round = true; // TODO: param or game config
        let moveX = Geometry.getLengthDirectionX(this.motion.speed, this.motion.direction);
        let moveY = Geometry.getLengthDirectionY(this.motion.speed, this.motion.direction);
        moveX = round ? Math.round(moveX) : moveX;
        moveY = round ? Math.round(moveY) : moveY;

        const boundary = this.actor.boundary;
        if (!boundary) {
            this.x += moveX;
            this.y += moveY;
            return;
        }

        const isFreeAt = (x: number, y: number): boolean => this.instances.getWithinBoundaryAtPosition(boundary, x, y, true, this).length === 0;

        // Resolve each axis separately, moving as close to any solid Boundary as possible.
        this.x += ActorInstance.getAllowedDistance(moveX, distance => isFreeAt(this.x + distance, this.y));
        this.y += ActorInstance.getAllowedDistance(moveY, distance => isFreeAt(this.x, this.y + distance));
    }

    private updateFollowPosition(): void {
        if (!this._followTarget) {
            return;
        }

        const target = this._followTarget;
        const newX = this._followOptions.centerOnTarget ? (target.x + target.width / 2 - this.width / 2) : target.x;
        this.x = Math.round(newX + this._followOptions.offsetX);

        const newY = this._followOptions.centerOnTarget ? (target.y + target.height / 2 - this.height / 2) : target.y;
        this.y = Math.round(newY + this._followOptions.offsetY);
    }

    activate(): void {
        this._status = InstanceStatus.Active;
    }

    collidesWith(other: Instance): boolean {
        if (this.actor.boundary && other.actor.boundary) {
            return this.actor.boundary.atPosition(this.x, this.y).collidesWith(other.actor.boundary.atPosition(other.x, other.y));
        }

        return false;
    }

    destroy(): void {
        this._status = InstanceStatus.Destroyed;
    }

    draw(canvas: GameCanvas, controller: Controller): void {
        if (this._status !== InstanceStatus.Active) {
            return;
        }

        if (this._animation) {
            this._animation.draw(canvas, this.x, this.y);
        }

        this.actor.callDraw(this, canvas, controller);
    }

    follow(target: PositionedEntity, options: FollowEntityOptions = {}): void {
        this._followTarget = target;
        this._followOptions.centerOnTarget = options.centerOnTarget !== undefined ? options.centerOnTarget : false;
        this._followOptions.offsetX = options.offsetX || 0;
        this._followOptions.offsetY = options.offsetY || 0;
    }

    handleGameEvent(self: Instance, event: GameEvent, controller: Controller): void {
        if (!event.isCancelled) {
            this.actor.callGameEvent(self, event, controller);
        }
    }

    handleKeyboardEvent(self: Instance, event: KeyboardInputEvent, controller: Controller): void {
        if (!event.isCancelled) {
            this.actor.callKeyboardEvent(self, event, controller);
        }
    }

    handlePointerEvent(self: Instance, event: PointerInputEvent, controller: Controller): void {
        if (!event.isCancelled) {
            if (self.actor.boundary && self.actor.boundary.atPosition(self.x, self.y).containsPosition(event.x, event.y)) {
                this.actor.callPointerEvent(self, event, controller);
            }
        }
    }

    inactivate(): void {
        this._status = InstanceStatus.Inactive;
    }

    // Each step: the Actor's onStep, then motion, following, animation, and finally collisions.
    step(controller: Controller): void {
        if (this._status !== InstanceStatus.Active) {
            return;
        }

        this.actor.callStep(this, controller);

        if (this._status !== InstanceStatus.Active) {
            return;
        }

        this.move();
        this.updateFollowPosition();

        if (this._animation) {
            this._animation.step(controller.stepDurationMs);
        }

        this.checkCollisions(controller);
    }
}
