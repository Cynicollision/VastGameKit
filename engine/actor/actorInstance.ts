import { Actor } from './actor';
import { ActorInstanceBehavior, ActorInstanceBehaviorName } from './actorInstanceBehavior';
import { ActorInstanceMotionBehavior } from './actorInstanceMotionBehavior';
import { GameCanvas } from './../device';
import { GameState } from './../game';
import { SpriteAnimation } from './../sprite';


export enum ActorInstanceStatus {
    New = 'New',
    Active = 'Active',
    Destroyed = 'Destroyed',
}

export class ActorInstance {
    private previousX: number;
    private previousY: number;

    private _id: number;
    get id() { return this._id; }

    private _actor: Actor;
    get actor() { return this._actor; }

    private _animation: SpriteAnimation;
    get animation() { return this._animation; }

    private _status: ActorInstanceStatus;
    get status() { return this._status; }

    private _behaviors: ActorInstanceBehavior[] = [];
    get behaviors() { return this._behaviors; }

    private _motion: ActorInstanceMotionBehavior;
    get motion() { return this._motion; }

    x: number = 0;
    y: number = 0;

    get hasMoved(): boolean {
        return (this.x !== this.previousX || this.y !== this.previousY);
    }

    // allow properties to dynamically be assigned to ActorInstances.
    [x: string | number | symbol]: unknown;

    static spawn(id: number, actor: Actor, x: number, y: number): ActorInstance {
        const instance = new ActorInstance(id, actor);
        instance.x = x; 
        instance.y = y;

        instance._animation = SpriteAnimation.forSprite(actor.sprite);
        instance._status = ActorInstanceStatus.New;

        for (const behavior of actor.behaviors) {
            instance.initBehavior(behavior);
        }
        
        return instance;
    }

    private constructor(id: number, actor: Actor) {
        this._id = id;
        this._actor = actor;
    }

    applyBeforeStepBehaviors(state: GameState): void {
        for (const behavior of this._behaviors) {
            behavior.beforeStep(this, state);
        }
    }

    applyAfterStepBehaviors(state: GameState): void {
        for (const behavior of this._behaviors) {
            behavior.afterStep(this, state);
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
            this._animation.draw(canvas, this.x, this.y);
        }

        this._actor.callDraw(this, state, canvas);
    }

    callStep(state: GameState): void {
        this.actor.callStep(this, state);
    }

    private initBehavior(behaviorName: ActorInstanceBehaviorName): void {

        // TODO add "init" callback to behavior, call here (accept self as arg) ?
        if (behaviorName === ActorInstanceBehaviorName.BasicMotion) {
            const motion = new ActorInstanceMotionBehavior();
            this._motion = motion;
            this._behaviors.push(motion);
        }
        
    }
}
