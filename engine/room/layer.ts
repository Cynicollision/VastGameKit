import { ActorInstance, ActorInstanceStatus, Boundary } from './../actor';
import { Background, BackgroundOptions } from './background';
import { RoomCamera } from './camera';
import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameEvent, GameState } from './../game';
import { Room } from './room';
import { Sprite } from './../sprite';

export enum LayerStatus {
    New = 1,
    Active = 2,
    Destroyed = 3,
}

type LayerLifecycleCallback = {
    (self: Layer, state: GameState): void;
};

type LayerLifecycleEventCallback = {
    (self: Layer, state: GameState, event: GameEvent): void;
};

type LayerKeyboardInputCallback = {
    (self: Layer, state: GameState, event: KeyboardInputEvent): void;
};

type LayerPointerInputCallback = {
    (self: Layer, state: GameState, event: PointerInputEvent): void;
};

type LayerLifecycleDrawCallback = {
    (self: Layer, state: GameState, canvas: GameCanvas): void;
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
    readonly room: Room;

    active: boolean;
    depth: number;
    height: number;
    width: number;
    visible: boolean;
    x: number;
    y: number;

    private _status: LayerStatus;
    get status() { return this._status; }

    private _followingCamera: RoomCamera;
    get followingCamera() { return this._followingCamera; }

    // allow properties to dynamically be assigned to Layers.
    [x: string | number | symbol]: unknown;
    
    static define(layerName: string, room: Room, options: LayerOptions = {}): Layer {
        const layer = new Layer(layerName, room, options);
        layer.init();

        return layer;
    }

    private constructor(name: string, room: Room, options: LayerOptions) {
        this.name = name;
        this.room = room;
        this.active = options.active !== undefined ? options.active : true;
        this.depth = options.depth || 0;
        this.height = options.height || room.height;
        this.width = options.width || room.width;
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

    callCreate(state: GameState): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(this, state);
        }
    }

    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): Layer {
        this.gameEventHandlerRegistry[eventName] = callback;
        return this;
    }

    callGameEvent(state: GameState, event: GameEvent): void {

        if (!event.isCancelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](this, state, event);
            }
        }
    }

    onKeyboardInput(key: string, callback: LayerKeyboardInputCallback): Layer {
        this.keyboardInputEventHandlerRegistry[key] = callback;
        return this;
    }

    callKeyboardInput(state: GameState, event: KeyboardInputEvent): void {
        const handler: LayerKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[event.key];
        if (handler) {
            handler(this, state, event);
        }
    }

    onPointerInput(type: string, callback: LayerPointerInputCallback): Layer {
        this.pointerInputEventHandlerRegistry[type] = callback;
        return this;
    }

    callPointerInput(state: GameState, event: PointerInputEvent): void {
        if (!event.isCancelled) {
            const handler: LayerPointerInputCallback = this.pointerInputEventHandlerRegistry[event.type];
            if (handler) {
                handler(this, state, event);
            }
        }
    }

    onStep(callback: LayerLifecycleCallback): Layer {
        this.onStepCallback = callback;
        return this;
    }

    step(state: GameState): void {

        if (!this.active) {
            return;
        }

        if (this.onStepCallback) {
            this.onStepCallback(this, state);
        }

        const raisedEvents = state.getQueuedEvents();

        for (const instance of this.getInstances()) {

            if (instance.status === ActorInstanceStatus.Destroyed) {
                this.deleteInstance(instance);
                instance.actor.callDestroy(instance, state);
            }
            else if (instance.status === ActorInstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, state);
            }
            else if (instance.status === ActorInstanceStatus.Active) {
                instance.callBeforeStepBehaviors(state);
                instance.callStep(state);
                instance.callAfterStepBehaviors(state);

                for (const event of raisedEvents) {
                    instance.actor.callGameEvent(instance, state, event);
                }
            }
        }

        for (const event of raisedEvents) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](this, state, event);
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

    draw(state: GameState, canvas: GameCanvas): void {

        if (!this.visible) {
            return;
        }

        if (this.background) {
            this.background.draw(canvas);
        }

        if (this.onDrawCallback) {
            this.onDrawCallback(this, state, canvas);
        }
    }

    onDestroy(callback: LayerLifecycleCallback): Layer {
        this.onDestroyCallback = callback;
        return this;
    }

    callDestroy(state: GameState): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(this, state);
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

    follow(view: RoomCamera, offsetX = 0, offsetY = 0): void {
        this._followingCamera = view;
        this.followOffsetX = offsetX;
        this.followOffsetY = offsetY;
    }

    createInstance(actorName: string, x?: number, y?: number): ActorInstance {
        const instanceId = this.room.game.nextActorInstanceID();
        const actor = this.room.game.getActor(actorName);

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
