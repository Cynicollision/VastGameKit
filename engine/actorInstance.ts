import { ActorBehaviorName, GameEvent, InstanceStatus, KeyboardInputEvent, ObjMap, PointerInputEvent } from './core';
import { GameCanvas } from './device/canvas';
import { ActorMotionBehavior } from './ext/behaviors/motionBehavior';
import { ActorDefinition, ActorBehavior, Actor } from './actor';
import { Controller } from './controller';
import { FollowEntityOptions, PositionedEntity } from './entity';
import { SpriteAnimation } from './spriteAnimation';

export type ActorInstanceOptions = {
    depth?: number;
    x?: number;
    y?: number;
};

export interface Instance extends PositionedEntity {
    readonly id: number;
    readonly animation: SpriteAnimation;
    readonly actor: Actor;
    readonly motion: ActorMotionBehavior;
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
    useBehavior(behavior: ActorBehavior): void;
}

export class ActorInstance implements Instance {
    private readonly behaviors: ActorBehavior[] = [];
    private _followTarget: PositionedEntity;
    private _followOptions: FollowEntityOptions = {};
    
    readonly id: number;
    readonly actor: ActorDefinition;
    readonly state: ObjMap<any> = {};

    private _animation: SpriteAnimation;
    get animation() { return this._animation; }

    private _status: InstanceStatus;
    get status() { return this._status; }

    private _motion: ActorMotionBehavior;
    get motion() { return this._motion; }

    depth: number = 0;
    x: number = 0;
    y: number = 0;

    get height(): number {
        return this.actor.boundary ? this.actor.boundary.width : 0;
    }

    get width(): number {
        return this.actor.boundary ? this.actor.boundary.width : 0;
    }

    constructor(id: number, actor: ActorDefinition, options: ActorInstanceOptions = {}) {
        this.id = id;
        this.actor = actor;
        this._status = InstanceStatus.New;

        this.depth = options.depth !== undefined ? options.depth : 0;
        this.x = options.x !== undefined ? options.x : 0;
        this.y = options.y !== undefined ? options.y : 0;

        if (actor.sprite) {
            this._animation = actor.sprite.newAnimation();
        }

        for (const behavior of actor.behaviors) {
            this.initBehavior(behavior);
        }
    }

    private initBehavior(behaviorName: ActorBehaviorName): void {
        if (behaviorName === ActorBehaviorName.BasicMotion) {
            const motion = new ActorMotionBehavior();
            this._motion = motion;
            this.useBehavior(motion);
        }
    }

    private updateFollowPosition(): void {
        if (!this._followTarget) {
            return;
        }

        const width = this._followTarget.width;
        const newX = this._followOptions.centerOnTarget ? (this._followTarget.x - width / 2 + this._followTarget.width / 2) : this._followTarget.x;
        this.x = Math.round(newX + this._followOptions.offsetX);

        const height = this._followTarget.height;
        const newY = this._followOptions.centerOnTarget ? (this._followTarget.y - height / 2 + this._followTarget.height / 2) : this._followTarget.y;
        this.y = Math.round(newY + this._followOptions.offsetY);
    }

    activate(): void {
        this._status = InstanceStatus.Active;
    }

    callAfterStepBehaviors(controller: Controller): void {
        for (const behavior of this.behaviors) {
            if (behavior.afterStep) {
                behavior.afterStep(this, controller);
            }
        }
    }

    callBeforeStepBehaviors(controller: Controller): void {
        for (const behavior of this.behaviors) {
            if (behavior.beforeStep) {
                behavior.beforeStep(this, controller);
            }
        }
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

    step(controller: Controller): void {
        if (this._status === InstanceStatus.Active) {
            this.actor.callStep(this, controller);
            this.updateFollowPosition();
        }
    }

    useBehavior(behavior: ActorBehavior): void {
        this.behaviors.push(behavior);
    }
}