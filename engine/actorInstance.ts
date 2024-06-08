import { ActorBehaviorName, GameEvent, InstanceStatus, KeyboardInputEvent, ObjMap, PointerInputEvent } from './core';
import { GameCanvas } from './device/canvas';
import { ActorMotionBehavior } from './ext/behaviors/motionBehavior';
import { Actor, ActorBehavior } from './actor';
import { SceneController } from './controller';
import { FollowEntityOptions, PositionedEntity } from './entity';
import { SpriteAnimation } from './spriteAnimation';

export type ActorInstanceOptions = {
    depth?: number;
    x?: number;
    y?: number;
}

export interface ActorInstance extends PositionedEntity {
    id: number;
    animation: SpriteAnimation;
    actor: Actor;
    depth: number;
    motion: ActorMotionBehavior;
    state: ObjMap<any>;
    status: InstanceStatus;
    x: number;
    y: number;
    activate(): void;
    collidesWith(other: ActorInstance): boolean;
    destroy(): void;
    follow(target: PositionedEntity, options?: FollowEntityOptions): void;
    inactivate(): void;
    useBehavior(behavior: ActorBehavior): void;
}

export class Instance implements ActorInstance {
    private readonly behaviors: ActorBehavior[] = [];
    private _followTarget: PositionedEntity;
    private _followOptions: FollowEntityOptions = {};
    
    readonly id: number;
    readonly actor: Actor;
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

    static spawn(id: number, actor: Actor, options: ActorInstanceOptions = {}): ActorInstance {
        const instance = new Instance(id, actor);
        instance.x = options.x || 0; 
        instance.y = options.y || 0;

        if (actor.sprite) {
            instance._animation = SpriteAnimation.forSprite(actor.sprite);
        }
        
        instance._status = InstanceStatus.New;

        for (const behavior of actor.behaviors) {
            instance.initBehavior(behavior);
        }
        
        return instance;
    }

    private constructor(id: number, actor: Actor) {
        this.id = id;
        this.actor = actor;
        this._status = InstanceStatus.New;
    }

    private initBehavior(behaviorName: ActorBehaviorName): void {
        if (behaviorName === ActorBehaviorName.BasicMotion) {
            const motion = new ActorMotionBehavior();
            this._motion = motion;
            this.useBehavior(motion);
        }
    }

    activate(): void {
        this._status = InstanceStatus.Active;
    }

    callAfterStepBehaviors(sc: SceneController): void {
        for (const behavior of this.behaviors) {
            if (behavior.afterStep) {
                behavior.afterStep(this, sc);
            }
        }
    }

    callBeforeStepBehaviors(sc: SceneController): void {
        for (const behavior of this.behaviors) {
            if (behavior.beforeStep) {
                behavior.beforeStep(this, sc);
            }
        }
    }

    collidesWith(other: ActorInstance): boolean {
        if (this.actor.boundary && other.actor.boundary) {
            return this.actor.boundary.atPosition(this.x, this.y).collidesWith(other.actor.boundary.atPosition(other.x, other.y));
        }

        return false;
    }

    destroy(): void {
        this._status = InstanceStatus.Destroyed;
    }

    draw(canvas: GameCanvas, sc: SceneController): void {
        if (this._status !== InstanceStatus.Active) {
            return;
        }

        if (this._animation) {
            this._animation.draw(canvas, this.x, this.y);
        }

        this.actor.callDraw(this, canvas, sc);
    }

    follow(target: PositionedEntity, options: FollowEntityOptions = {}): void {
        this._followTarget = target;
        this._followOptions.centerOnTarget = options.centerOnTarget !== undefined ? options.centerOnTarget : false;
        this._followOptions.offsetX = options.offsetX || 0;
        this._followOptions.offsetY = options.offsetY || 0;
    }

    handleGameEvent(self: ActorInstance, event: GameEvent, sc: SceneController): void {
        if (!event.isCancelled) {
            this.actor.callGameEvent(self, event, sc);
        }
    }

    handleKeyboardEvent(self: ActorInstance, event: KeyboardInputEvent, sc: SceneController): void {
        if (!event.isCancelled) {
            this.actor.callKeyboardEvent(self, event, sc);
        }
    }

    handlePointerEvent(self: ActorInstance, event: PointerInputEvent, sc: SceneController): void {
        if (!event.isCancelled) {
            if (self.actor.boundary && self.actor.boundary.atPosition(self.x, self.y).containsPosition(event.x, event.y)) {
                this.actor.callPointerEvent(self, event, sc);
            }
        }
    }

    inactivate(): void {
        this._status = InstanceStatus.Inactive;
    }

    step(sc: SceneController): void {
        if (this._status === InstanceStatus.Active) {
            this.actor.callStep(this, sc);
            this.updateFollowPosition();
        }
    }

    useBehavior(behavior: ActorBehavior): void {
        this.behaviors.push(behavior);
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
}