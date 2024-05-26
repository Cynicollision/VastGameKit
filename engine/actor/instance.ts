import { ActorMotionBehavior } from './behaviors/motionBehavior';
import { Actor } from './actor';
import { ActorBehavior, ActorBehaviorName } from './behavior';
import { GameCanvas } from './../device/canvas';
import { SceneController } from './../scene/controller';
import { Layer } from './../scene/layer';
import { SpriteAnimation } from './../sprite/spriteAnimation';

export enum ActorInstanceStatus {
    New = 'New',
    Active = 'Active',
    Destroyed = 'Destroyed',
}

export class ActorInstance {
    readonly behaviors: ActorBehavior[] = [];
    readonly id: number;
    readonly actor: Actor;
    readonly layer: Layer;

    private _animation: SpriteAnimation;
    get animation() { return this._animation; }

    private _status: ActorInstanceStatus;
    get status() { return this._status; }

    private _motion: ActorMotionBehavior;
    get motion() { return this._motion; }

    state: { [name: string]: unknown } = {};
    x: number = 0;
    y: number = 0;

    static spawn(id: number, actor: Actor, layer: Layer, x: number, y: number): ActorInstance {
        const instance = new ActorInstance(id, actor, layer);
        instance.x = x; 
        instance.y = y;

        if (actor.sprite) {
            instance._animation = SpriteAnimation.forSprite(actor.sprite);
        }
        
        instance._status = ActorInstanceStatus.New;

        for (const behavior of actor.behaviors) {
            instance.initBehavior(behavior);
        }
        
        return instance;
    }

    private constructor(id: number, actor: Actor, layer: Layer) {
        this.id = id;
        this.actor = actor;
        this.layer = layer;
        this._status = ActorInstanceStatus.New;
    }

    private initBehavior(behaviorName: ActorBehaviorName): void {
        if (behaviorName === ActorBehaviorName.BasicMotion) {
            const motion = new ActorMotionBehavior();
            this._motion = motion;
            this.useBehavior(motion);
        }
    }

    useBehavior(behavior: ActorBehavior) {
        this.behaviors.push(behavior);
    }

    callBeforeStepBehaviors(gc: SceneController): void {
        for (const behavior of this.behaviors) {
            if (behavior.beforeStep) {
                behavior.beforeStep(this, gc);
            }
        }
    }

    callAfterStepBehaviors(gc: SceneController): void {
        for (const behavior of this.behaviors) {
            if (behavior.afterStep) {
                behavior.afterStep(this, gc);
            }
        }
    }

    activate(): void {
        this._status = ActorInstanceStatus.Active;
    }

    destroy(): void {
        this._status = ActorInstanceStatus.Destroyed;
    }

    draw(gc: SceneController, canvas: GameCanvas): void {
        if (this._animation) {
            this._animation.draw(canvas, this.x + this.layer.x, this.y + this.layer.y);
        }

        this.actor.callDraw(this, gc, canvas);
    }

    callStep(gc: SceneController): void {
        this.actor.callStep(this, gc);
    }

    collidesWith(other: ActorInstance): boolean {
        if (this.actor.boundary && other.actor.boundary) {
            return this.actor.boundary.atPosition(this.x, this.y).collidesWith(other.actor.boundary.atPosition(other.x, other.y));
        }

        return false;
    }
}
