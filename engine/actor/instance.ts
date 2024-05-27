import { ActorBehaviorName, InstanceStatus } from './../core/enum';
import { GameCanvas } from './../device/canvas';
import { SceneController } from './../scene/controller';
import { SceneDefinition } from './../scene/scene';
import { SpriteAnimation } from './../sprite/spriteAnimation';
import { ActorMotionBehavior } from './behaviors/motionBehavior';
import { Actor, ActorBehavior } from './actor';


export interface ActorInstance {
    id: number;
    animation: SpriteAnimation;
    actor: Actor;
    motion: ActorMotionBehavior;
    scene: SceneDefinition;
    state: { [name: string]: unknown };
    status: InstanceStatus;
    x: number;
    y: number;
    activate(): void;
    collidesWith(other: ActorInstance): boolean;
    destroy(): void;
    //follow(actor or camera): void; // TODO add
    inactivate(): void;
    useBehavior(behavior: ActorBehavior): void;
}

export class Instance implements ActorInstance {
    private readonly behaviors: ActorBehavior[] = [];
    readonly id: number;
    readonly actor: Actor;
    readonly scene: SceneDefinition;

    private _animation: SpriteAnimation;
    get animation() { return this._animation; }

    private _status: InstanceStatus;
    get status() { return this._status; }

    private _motion: ActorMotionBehavior;
    get motion() { return this._motion; }

    readonly state: { [name: string]: unknown } = {};
    x: number = 0;
    y: number = 0;

    static spawn(id: number, actor: Actor, scene: SceneDefinition, x: number, y: number): ActorInstance {
        const instance = new Instance(id, actor, scene);
        instance.x = x; 
        instance.y = y;

        if (actor.sprite) {
            instance._animation = SpriteAnimation.forSprite(actor.sprite);
        }
        
        instance._status = InstanceStatus.New;

        for (const behavior of actor.behaviors) {
            instance.initBehavior(behavior);
        }
        
        return instance;
    }

    private constructor(id: number, actor: Actor, scene: SceneDefinition) {
        this.id = id;
        this.actor = actor;
        this.scene = scene;
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

    callStep(sc: SceneController): void {
        if (this._status === InstanceStatus.Active) {
            this.actor.callStep(this, sc);
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

    // TODO add
    // follow(camera: Camera | Actor, offsetX = 0, offsetY = 0): void {
    //     this._followingCamera = camera;
    //     this.followOffsetX = offsetX;
    //     this.followOffsetY = offsetY;
    // }

    inactivate(): void {
        this._status = InstanceStatus.Inactive;
    }

    useBehavior(behavior: ActorBehavior): void {
        this.behaviors.push(behavior);
    }
}