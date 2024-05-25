import { ActorInstance, ActorInstanceStatus, Boundary } from '../actor';
import { Background, BackgroundOptions } from './background';
import { SceneCamera } from './camera';
import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from '../device';
import { GameController, GameEvent } from '../game';
import { Scene } from './scene';
import { Sprite } from '../sprite';

export enum LayerStatus {
    New = 1,
    Active = 2,
    Destroyed = 3,
}

type LayerLifecycleCallback = {
    (self: Layer, gc: GameController): void;
};

type LayerLifecycleEventCallback = {
    (self: Layer, gc: GameController, ev: GameEvent): void;
};

type LayerKeyboardInputCallback = {
    (self: Layer, gc: GameController, ev: KeyboardInputEvent): void;
};

type LayerPointerInputCallback = {
    (self: Layer, gc: GameController, ev: PointerInputEvent): void;
};

type LayerLifecycleDrawCallback = {
    (self: Layer, gc: GameController, canvas: GameCanvas): void;
};

export type LayerOptions = {
    active?: boolean;
    depth?: number;
    height?: number;
    width?: number;
    visible?: boolean;
    x?: number;
    y?: number;
};

// TODO rename: SceneLayer?
export class Layer {
    private actorInstanceRegistry: { [index: number]: ActorInstance } = {};

    private gameEventHandlerRegistry: { [eventName: string]: LayerLifecycleEventCallback } = {};
    private keyboardInputEventHandlerRegistry: { [type: string]: LayerKeyboardInputCallback } = {};
    private pointerInputEventHandlerRegistry: { [type: string]: LayerPointerInputCallback } = {};

    private onCreateCallback: LayerLifecycleCallback;
    private onStepCallback: LayerLifecycleCallback;
    private onDrawCallback: LayerLifecycleDrawCallback;
    private onDestroyCallback: LayerLifecycleCallback;

    private background: Background;
    private followOffsetX: number;
    private followOffsetY: number;

    readonly name: string;
    readonly scene: Scene;

    active: boolean;
    depth: number;
    height: number;
    width: number;
    visible: boolean;
    x: number;
    y: number;

    private _status: LayerStatus;
    get status() { return this._status; }

    private _followingCamera: SceneCamera;
    get followingCamera() { return this._followingCamera; }

    state: { [name: string]: unknown } = {};
    
    static define(layerName: string, scene: Scene, options: LayerOptions = {}): Layer {
        const layer = new Layer(layerName, scene, options);
        layer.init();

        return layer;
    }

    private constructor(name: string, scene: Scene, options: LayerOptions) {
        this.name = name;
        this.scene = scene;
        this.active = options.active !== undefined ? options.active : true;
        this.depth = options.depth || 0;
        this.height = options.height || scene.height;
        this.width = options.width || scene.width;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    init(): void {
        this._status = LayerStatus.New;
        this.actorInstanceRegistry = {};
    }

    activate(): void {
        this._status = LayerStatus.Active;
    }

    destroy(): void {
        this._status = LayerStatus.Destroyed;
    }

    onCreate(callback: LayerLifecycleCallback): Layer {
        this.onCreateCallback = callback;
        return this;
    }

    callCreate(gc: GameController): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(this, gc);
        }
    }

    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): Layer {
        this.gameEventHandlerRegistry[eventName] = callback;
        return this;
    }

    callGameEvent(gc: GameController, ev: GameEvent): void {

        if (!ev.isCancelled) {
            if (this.gameEventHandlerRegistry[ev.name]) {
                this.gameEventHandlerRegistry[ev.name](this, gc, ev);
            }
        }
    }

    onKeyboardInput(key: string, callback: LayerKeyboardInputCallback): Layer {
        this.keyboardInputEventHandlerRegistry[key] = callback;
        return this;
    }

    callKeyboardInput(gc: GameController, ev: KeyboardInputEvent): void {
        const handler: LayerKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[ev.key];
        if (handler) {
            handler(this, gc, ev);
        }
    }

    onPointerInput(type: string, callback: LayerPointerInputCallback): Layer {
        this.pointerInputEventHandlerRegistry[type] = callback;
        return this;
    }

    callPointerInput(gc: GameController, ev: PointerInputEvent): void {
        if (!ev.isCancelled) {
            const handler: LayerPointerInputCallback = this.pointerInputEventHandlerRegistry[ev.type];
            if (handler) {
                handler(this, gc, ev);
            }
        }
    }

    onStep(callback: LayerLifecycleCallback): Layer {
        this.onStepCallback = callback;
        return this;
    }

    step(gc: GameController): void {

        if (!this.active) {
            return;
        }

        if (this.onStepCallback) {
            this.onStepCallback(this, gc);
        }

        const raisedEvents = gc.getQueuedEvents();

        for (const instance of this.getInstances()) {

            if (instance.status === ActorInstanceStatus.Destroyed) {
                this.deleteInstance(instance);
                instance.actor.callDestroy(instance, gc);
            }
            else if (instance.status === ActorInstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, gc);
            }
            else if (instance.status === ActorInstanceStatus.Active) {
                instance.callBeforeStepBehaviors(gc);
                instance.callStep(gc);
                instance.callAfterStepBehaviors(gc);

                // TODO: remove loop. add instance.actor.hasEventHandler(ev.name)
                //  add to instanceEventTargets
                //  call in next loop
                for (const ev of raisedEvents) {
                    instance.actor.callGameEvent(instance, gc, ev);
                }
            }
        }

        for (const ev of raisedEvents) {
            if (this.gameEventHandlerRegistry[ev.name]) {
                this.gameEventHandlerRegistry[ev.name](this, gc, ev);
            }
        }

        this.updatePosition();
    }

    private updatePosition(): void {
        if (this._followingCamera) {
            this.x = this._followingCamera.x + this.followOffsetX;
            this.y = this._followingCamera.y + this.followOffsetY;
        }
    }

    onDraw(callback: LayerLifecycleDrawCallback): Layer {
        this.onDrawCallback = callback;
        return this;
    }

    draw(gc: GameController, canvas: GameCanvas): void {
        if (!this.visible) {
            return;
        }

        if (this.background) {
            this.background.draw(canvas);
        }

        for (const instance of this.getInstances()) {
            instance.draw(gc, canvas);
        }

        if (this.onDrawCallback) {
            this.onDrawCallback(this, gc, canvas);
        }
    }

    onDestroy(callback: LayerLifecycleCallback): Layer {
        this.onDestroyCallback = callback;
        return this;
    }

    callDestroy(gc: GameController): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(this, gc);
        }
    }
    
    setBackground(colorOrSprite: string | Sprite, options: BackgroundOptions = {}): Layer {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(this, colorOrSprite, options);
        }
        else {
            this.background = Background.fromSprite(this, colorOrSprite, options);
        }

        return this;
    }

    follow(view: SceneCamera, offsetX = 0, offsetY = 0): void {
        this._followingCamera = view;
        this.followOffsetX = offsetX;
        this.followOffsetY = offsetY;
    }

    createInstance(actorName: string, x?: number, y?: number): ActorInstance {
        const instanceId = this.scene.game.nextActorInstanceID();
        const actor = this.scene.game.getActor(actorName);

        const spawnX = (x || 0) + this.x;
        const spawnY = (y || 0) + this.y;

        const newInstance = ActorInstance.spawn(instanceId, actor, this, spawnX, spawnY);
        this.actorInstanceRegistry[instanceId] = newInstance;

        return newInstance;
    }

    createInstancesFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[] {
        const instances = [];

        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                const actorName = instanceKey[map[i][j]];
                if (actorName) {
                    instances.push(this.createInstance(actorName, j * gridSize, i * gridSize));
                }
            }
        }

        return instances;
    }

    deleteInstance(instance: ActorInstance): void {
        delete this.actorInstanceRegistry[instance.id];
    }

    getInstances(actorName?: string): ActorInstance[] {
        const instances: ActorInstance[] = [];

        for (const a in this.actorInstanceRegistry) {
            const instance = this.actorInstanceRegistry[a];
            if (!actorName || actorName === instance.actor.name) {
                instances.push(this.actorInstanceRegistry[a]);
            }
        }

        return instances;
    }

    getInstancesWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid: boolean = false): ActorInstance[] {
        const instances = [];

        for (const a in this.actorInstanceRegistry) {
            const instance = this.actorInstanceRegistry[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(boundary.atPosition(x, y))) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    getInstancesAtPosition(x: number, y: number, solid: boolean = false): ActorInstance[] {
        const instances = [];

        for (const a in this.actorInstanceRegistry) {
            const instance = this.actorInstanceRegistry[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    isPositionFree(x: number, y: number, solid: boolean = false): boolean {
        for (const a in this.actorInstanceRegistry) {
            const instance = this.actorInstanceRegistry[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                return !(!solid || solid && instance.actor.solid);
            }
        }

        return true;
    }
}
