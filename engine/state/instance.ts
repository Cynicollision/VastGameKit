import { GameError, GameEvent, Geometry, InstanceStatus, KeyboardInputEvent, ObjMap, PointerInputEvent } from './../core';
import { GameCanvas } from './../device/canvas';
import { SpriteAnimation } from './../resources/spriteAnimation';
import { ActorDefinition, Actor } from './../structure/actor';
import { FollowEntityOptions, PositionedEntity } from './../structure/entity';
import { Controller } from './controller';
import type { SceneInstanceState } from './instanceState';
import { InstanceMotion } from './motion';

export type ActorInstanceOptions = {
    depth?: number;
    x?: number;
    y?: number;
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
    // Whether the Instance's Boundary would overlap no solid Instances (other than itself) at the position.
    isPlaceFree(x: number, y: number): boolean;
}

export class ActorInstance implements Instance {
    // the Scene's instances this Instance belongs to, used for movement and collisions.
    private readonly instances: SceneInstanceState;
    private _followTarget?: PositionedEntity;
    private _followOptions: Required<FollowEntityOptions> = { centerOnTarget: false, offsetX: 0, offsetY: 0 };

    readonly id: number;
    readonly actor: ActorDefinition;
    // moves the Instance each step, stopping short of solid Instances.
    readonly motion = new InstanceMotion();
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

    private _depth: number;
    get depth(): number { return this._depth; }
    set depth(value: number) {
        if (value !== this._depth) {
            this._depth = value;
            this.instances.onDepthChanged();
        }
    }

    private _x: number;
    get x(): number { return this._x; }
    set x(value: number) {
        if (value !== this._x) {
            this._x = value;
            this.instances.onMoved(this);
        }
    }

    private _y: number;
    get y(): number { return this._y; }
    set y(value: number) {
        if (value !== this._y) {
            this._y = value;
            this.instances.onMoved(this);
        }
    }

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

        this._depth = options.depth !== undefined ? options.depth : 0;
        this._x = options.x !== undefined ? options.x : 0;
        this._y = options.y !== undefined ? options.y : 0;

        if (actor.sprite) {
            this._animation = actor.sprite.newAnimation();
        }
    }

    private checkCollisions(controller: Controller): void {
        if (!this.actor.hasCollisionHandlers) {
            return;
        }

        for (const other of this.instances.getCollisionCandidates(this)) {
            if (this._status !== InstanceStatus.Active) {
                return;
            }

            // handlers may move or destroy Instances, so check each candidate as it's reached.
            if (other.status === InstanceStatus.Active && this.actor.hasCollisionHandler(other.actor.name) && this.collidesWith(other)) {
                this.actor.callCollision(this, other, controller);
            }
        }
    }

    private move(): void {
        if (this.motion.velocityX !== 0 || this.motion.velocityY !== 0) {
            // each axis is resolved separately, moving as close to any solid Boundary as possible.
            this.motion.move(this, (x, y) => this.isPlaceFree(x, y));
        }
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
            return this.actor.boundary.collidesAt(this._x, this._y, other.actor.boundary, other.x, other.y);
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
        if (!event.isCancelled && this.actor.hasPointerInputHandler(event.type)) {
            if (self.actor.boundary && self.actor.boundary.containsPositionAt(self.x, self.y, event.x, event.y)) {
                this.actor.callPointerEvent(self, event, controller);
            }
        }
    }

    // Whether this Instance may draw anything within the view. Instances whose Actor has an onDraw callback always may.
    isVisibleIn(viewX: number, viewY: number, viewWidth: number, viewHeight: number): boolean {
        if (this.actor.hasDrawCallback) {
            return true;
        }

        if (!this._animation) {
            return false;
        }

        const sprite = this._animation.sprite;
        const overhang = this._animation.overhang;
        return Geometry.rectangleIntersectsRectangle(this._x - overhang, this._y - overhang, sprite.width + overhang * 2, sprite.height + overhang * 2, viewX, viewY, viewWidth, viewHeight);
    }

    inactivate(): void {
        this._status = InstanceStatus.Inactive;
    }

    isPlaceFree(x: number, y: number): boolean {
        const boundary = this.actor.boundary;
        return !boundary || this.instances.isAreaFree(boundary, x, y, true, this);
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
