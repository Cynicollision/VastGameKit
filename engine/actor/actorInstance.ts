import { Actor } from './actor';
import { ActorInstanceBehavior, ActorInstanceBehaviorName, ActorInstanceMotionBehavior } from './actorInstanceBehavior';
import { GameCanvas } from './../device';
import { GameState } from './../game';
import { Layer } from './../room';
import { SpriteAnimation } from './../sprite';

export enum ActorInstanceStatus {
    New = 'New',
    Active = 'Active',
    Destroyed = 'Destroyed',
}

export class ActorInstance {
    private readonly behaviors: ActorInstanceBehavior[] = [];
    readonly id: number;
    readonly actor: Actor;
    readonly layer: Layer;

    private _animation: SpriteAnimation;
    get animation() { return this._animation; }

    private _status: ActorInstanceStatus;
    get status() { return this._status; }

    private _motion: ActorInstanceMotionBehavior;
    get motion() { return this._motion; }

    x: number = 0;
    y: number = 0;

    // allow properties to dynamically be assigned to ActorInstances.
    // TODO: also on Layers?
    [x: string | number | symbol]: unknown;

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

    private initBehavior(behaviorName: ActorInstanceBehaviorName): void {
        if (behaviorName === ActorInstanceBehaviorName.BasicMotion) {
            const motion = new ActorInstanceMotionBehavior();
            this._motion = motion;
            this.behaviors.push(motion);
        }
    }

    applyBeforeStepBehaviors(state: GameState): void {
        for (const behavior of this.behaviors) {
            if (behavior.beforeStep) {
                behavior.beforeStep(this, state);
            }
        }
    }

    applyAfterStepBehaviors(state: GameState): void {
        for (const behavior of this.behaviors) {
            if (behavior.afterStep) {
                behavior.afterStep(this, state);
            }
        }
    }

    activate(): void {
        this._status = ActorInstanceStatus.Active;
    }

    destroy(): void {
        this._status = ActorInstanceStatus.Destroyed;
    }

    draw(state: GameState, canvas: GameCanvas): void {
        if (this._animation) {
            this._animation.draw(canvas, this.x + this.layer.x, this.y + this.layer.y);
        }

        this.actor.callDraw(this, state, canvas);
    }

    callStep(state: GameState): void {
        this.actor.callStep(this, state);
    }

    collidesWith(other: ActorInstance): boolean {
        if (this.actor.boundary && other.actor.boundary) {
            return this.actor.boundary.atPosition(this.x, this.y).collidesWith(other.actor.boundary.atPosition(other.x, other.y));
        }

        return false;
    }
}
