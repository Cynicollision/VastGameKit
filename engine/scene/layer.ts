import { Actor } from './../actor/actor';
import { ActorInstance, Instance } from './../actor/instance';
import { Boundary } from './../actor/boundary';
import { InstanceStatus, LayerStatus } from './../core/enum';
import { GameEvent } from './../core/event';
import { GameCanvas } from './../device/canvas';
import { KeyboardInputEvent } from './../device/keyboard';
import { PointerInputEvent } from './../device/pointer';
import { Sprite } from './../sprite/sprite';
import { Background, BackgroundOptions } from './background';
import { Camera, SceneCamera } from './camera';
import { SceneController } from './controller';
import { Scene } from './scene';

type LayerLifecycleCallback = {
    (self: SceneLayer, sc: SceneController): void;
};

type LayerLifecycleEventCallback = {
    (self: SceneLayer, ev: GameEvent, sc: SceneController): void;
};

type LayerKeyboardInputCallback = {
    (self: SceneLayer, ev: KeyboardInputEvent, sc: SceneController): void;
};

type LayerPointerInputCallback = {
    (self: SceneLayer, ev: PointerInputEvent, sc: SceneController): void;
};

type LayerLifecycleDrawCallback = {
    (self: SceneLayer, canvas: GameCanvas, sc: SceneController): void;
};

export type LayerOptions = {
    active?: boolean;
    depth?: number;
    height?: number;
    status?: LayerStatus;
    width?: number;
    visible?: boolean;
    x?: number;
    y?: number;
};

export interface SceneLayer {
    name: string;
    scene: Scene;
    depth: number;
    height: number;
    state: { [name: string]: unknown };
    status: LayerStatus;
    visible: boolean;
    width: number;
    x: number;
    y: number;
    createInstance(actorName: string, x?: number, y?: number): ActorInstance;
    createInstancesFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[];
    destroy(): void;
    follow(view: SceneCamera, offsetX?: number, offsetY?: number): void;
    getInstances(actorName?: string): ActorInstance[];
    getInstancesAtPosition(x: number, y: number, solid?: boolean): ActorInstance[]
    getInstancesWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid?: boolean): ActorInstance[]
    inactivate(): void;
    isPositionFree(x: number, y: number, solid?: boolean): boolean
    onCreate(callback: LayerLifecycleCallback): SceneLayer;
    onDestroy(callback: LayerLifecycleCallback): SceneLayer;
    onDraw(callback: LayerLifecycleDrawCallback): SceneLayer;
    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): SceneLayer;
    onKeyboardInput(key: string, callback: LayerKeyboardInputCallback): SceneLayer;
    onPointerInput(type: string, callback: LayerPointerInputCallback): SceneLayer;
    onStep(callback: LayerLifecycleCallback): SceneLayer;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundOptions): SceneLayer;
}

export class Layer {
    private instanceMap: { [index: number]: Instance } = {};
    private gameEventHandlerMap: { [eventName: string]: LayerLifecycleEventCallback } = {};
    private keyboardInputEventHandlerMap: { [type: string]: LayerKeyboardInputCallback } = {};
    private pointerInputEventHandlerMap: { [type: string]: LayerPointerInputCallback } = {};

    private onCreateCallback: LayerLifecycleCallback;
    private onStepCallback: LayerLifecycleCallback;
    private onDrawCallback: LayerLifecycleDrawCallback;
    private onDestroyCallback: LayerLifecycleCallback;

    private background: Background;
    private followOffsetX: number;
    private followOffsetY: number;

    private _status: LayerStatus;
    get status() { return this._status; }

    private _followingCamera: Camera;
    get followingCamera(): SceneCamera { return this._followingCamera; }

    readonly name: string;
    readonly scene: Scene;
    depth: number;
    height: number;
    state: { [name: string]: unknown } = {};
    width: number;
    visible: boolean;
    x: number;
    y: number;

    static define(layerName: string, scene: Scene, options: LayerOptions = {}): SceneLayer {
        const layer = new Layer(layerName, scene, options);
        layer.init();

        return layer;
    }

    private constructor(name: string, scene: Scene, options: LayerOptions) {
        this.name = name;
        this.scene = scene;
        this.depth = options.depth || 0;
        this.height = options.height || scene.height;
        this._status = options.status || LayerStatus.New;
        this.width = options.width || scene.width;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    private deleteInstance(instance: ActorInstance): void {
        delete this.instanceMap[instance.id];
    }

    private updatePosition(): void {
        if (this._followingCamera) {
            this.x = this._followingCamera.x + this.followOffsetX;
            this.y = this._followingCamera.y + this.followOffsetY;
        }
    }

    activate(): void {
        this._status = LayerStatus.Active;
    }

    callCreate(sc: SceneController): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(this, sc);
        }
    }

    callDestroy(sc: SceneController): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(this, sc);
        }
    }

    callGameEvent(ev: GameEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            if (this.gameEventHandlerMap[ev.name]) {
                this.gameEventHandlerMap[ev.name](this, ev, sc);
            }
        }
    }

    callKeyboardInput(ev: KeyboardInputEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            const handler: LayerKeyboardInputCallback = this.keyboardInputEventHandlerMap[ev.key];
            if (handler) {
                handler(this, ev, sc);
            }
        }
    }

    callPointerInput(ev: PointerInputEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            const handler: LayerPointerInputCallback = this.pointerInputEventHandlerMap[ev.type];
            if (handler) {
                handler(this, ev, sc);
            }
        }
    }

    createInstance(actorName: string, x?: number, y?: number): ActorInstance {
        const instanceId = this.scene.game.nextActorInstanceID();
        const actor = <Actor>this.scene.game.getActor(actorName);

        const spawnX = (x || 0) + this.x;
        const spawnY = (y || 0) + this.y;

        const newInstance = <Instance>Instance.spawn(instanceId, actor, this, spawnX, spawnY);
        this.instanceMap[instanceId] = newInstance;

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

    destroy(): void {
        this._status = LayerStatus.Destroyed;
    }

    draw(canvas: GameCanvas, sc: SceneController): void {
        if (!this.visible) {
            return;
        }

        if (this.background) {
            this.background.draw(canvas);
        }

        for (const instance of <Instance[]>this.getInstances()) {
            instance.draw(canvas, sc);
        }

        if (this.onDrawCallback) {
            this.onDrawCallback(this, canvas, sc);
        }
    }

    follow(camera: Camera, offsetX = 0, offsetY = 0): void {
        this._followingCamera = camera;
        this.followOffsetX = offsetX;
        this.followOffsetY = offsetY;
    }

    getInstances(actorName?: string): ActorInstance[] {
        const instances: Instance[] = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (!actorName || actorName === instance.actor.name) {
                instances.push(this.instanceMap[a]);
            }
        }

        return instances;
    }

    getInstancesAtPosition(x: number, y: number, solid: boolean = false): ActorInstance[] {
        const instances = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    getInstancesWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid: boolean = false): ActorInstance[] {
        const instances = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(boundary.atPosition(x, y))) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    isPositionFree(x: number, y: number, solid: boolean = false): boolean {
        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                return !(!solid || solid && instance.actor.solid);
            }
        }

        return true;
    }

    inactivate(): void {
        this._status = LayerStatus.Inactive;
    }

    init(): void {
        this._status = LayerStatus.New;
        this.instanceMap = {};
    }

    onCreate(callback: LayerLifecycleCallback): SceneLayer {
        this.onCreateCallback = callback;
        return this;
    }

    onDestroy(callback: LayerLifecycleCallback): SceneLayer {
        this.onDestroyCallback = callback;
        return this;
    }

    onDraw(callback: LayerLifecycleDrawCallback): SceneLayer {
        this.onDrawCallback = callback;
        return this;
    }

    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): SceneLayer {
        this.gameEventHandlerMap[eventName] = callback;
        return this;
    }

    onKeyboardInput(key: string, callback: LayerKeyboardInputCallback): SceneLayer {
        this.keyboardInputEventHandlerMap[key] = callback;
        return this;
    }

    onPointerInput(type: string, callback: LayerPointerInputCallback): SceneLayer {
        this.pointerInputEventHandlerMap[type] = callback;
        return this;
    }

    onStep(callback: LayerLifecycleCallback): SceneLayer {
        this.onStepCallback = callback;
        return this;
    }

    setBackground(colorOrSprite: string | Sprite, options: BackgroundOptions = {}): SceneLayer {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(this, colorOrSprite, options);
        }
        else {
            this.background = Background.fromSprite(this, colorOrSprite, options);
        }

        return this;
    }

    step(events: GameEvent[], sc: SceneController): void {
        if (this._status !== LayerStatus.Active) {
            return;
        }

        if (this.onStepCallback) {
            this.onStepCallback(this, sc);
        }

        for (const instance of <Instance[]>this.getInstances()) {
            if (instance.status === InstanceStatus.Destroyed) {
                this.deleteInstance(instance);
                instance.actor.callDestroy(instance, sc);
            }
            else if (instance.status === InstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, sc);
            }
            else if (instance.status === InstanceStatus.Active) {
                instance.callBeforeStepBehaviors(sc);
                instance.callStep(sc);
                instance.callAfterStepBehaviors(sc);

                for (const ev of events) {
                    instance.actor.callGameEvent(instance, ev, sc);
                }
            }
        }

        for (const ev of events) {
            if (this.gameEventHandlerMap[ev.name]) {
                this.gameEventHandlerMap[ev.name](this, ev, sc);
            }
        }

        this.updatePosition();
    }
}
