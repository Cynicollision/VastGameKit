import { ActorInstance, ActorInstanceStatus } from './../actor';
import { GameCanvas } from './../device';
import { GameEvent, GameState } from './../game';
import { Room, RoomView } from './room';

interface LayerLifecycleCallback {
    (self: Layer, state: GameState): void;
}

export interface LayerLifecycleEventCallback {
    (self: Layer, state: GameState, event: GameEvent): void;
}

interface LayerLifecycleDrawCallback {
    (self: Layer, state: GameState, canvas: GameCanvas): void;
}

export interface LayerOptions {
    depth?: number;
    visible?: boolean;
    x?: number;
    y?: number;
}

export enum LayerStatus {
    New = 1,
    Active = 2,
    Destroyed = 3,
}

export class Layer {
    private actorInstanceRegistry: { [index: number]: ActorInstance } = {};
    private actorInstanceRegistryByActor: { [actorName: string]: ActorInstance[] } = {};

    private gameEventHandlerRegistry: { [eventName: string]: LayerLifecycleEventCallback } = {};

    private onCreateCallback: LayerLifecycleCallback;
    private onStepCallback: LayerLifecycleCallback;
    private onDrawCallback: LayerLifecycleDrawCallback;
    private onDestroyCallback: LayerLifecycleCallback;

    private readonly _room: Room;
    get room() { return this._room; }

    private _followingView: RoomView;
    get followingView() { return this._followingView; }

    private readonly _name: string;
    get name() { return this._name; }

    private _status: LayerStatus;
    get status() { return this._status; }
    
    depth: number;
    visible: boolean; // TODO implement (control whether this layer is drawn)
    x: number;
    y: number;

    static define(room: Room, layerName: string, options?: LayerOptions): Layer {
        const layer = new Layer(room, layerName);
        layer.init();

        options = options || {};
        layer.depth = options.depth || 0;
        layer.visible = options.visible || true;
        layer.x = options.x || 0;
        layer.y = options.y || 0;

        return layer;
    }

    private constructor(room: Room, name: string) {
        this._name = name;
        this._room = room;
    }

    init(): void {
        this._status = LayerStatus.New;
        this.actorInstanceRegistry = {};
        this.actorInstanceRegistryByActor = {};
    }

    activate(): void {
        this._status = LayerStatus.Active;
    }

    destroy(): void {
        this._status = LayerStatus.Destroyed;
    }

    follow(view: RoomView): void {
        this._followingView = view;
    }

    onCreate(callback: LayerLifecycleCallback): void {
        this.onCreateCallback = callback;
    }

    callCreate(state: GameState): void {
        if (this.onCreateCallback) {
            this.onCreateCallback(this, state);
        }
    }

    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): void {
        this.gameEventHandlerRegistry[eventName] = callback;
    }

    callEvent(state: GameState, event: GameEvent): void {

        if (!event.isCanelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](this, state, event);
            }
        }
    }

    onStep(callback: LayerLifecycleCallback): void {
        this.onStepCallback = callback;
    }

    step(state: GameState): void {

        if (this.onStepCallback) {
            this.onStepCallback(this, state);
        }

        const raisedEvents = state.getQueuedEvents();

        for (const instance of this.getActorInstances()) {

            if (instance.status === ActorInstanceStatus.Destroyed) {
                this.deleteInstance(instance);
                instance.actor.callDestroy(instance, state);
            }
            else if (instance.status === ActorInstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, state);
            }
            else if (instance.status === ActorInstanceStatus.Active) {
                // TODO checkCollisions(layer, instance), somewhere.
                instance.applyBeforeStepBehaviors(state);
                instance.callStep(state);
                instance.applyAfterStepBehaviors(state);

                for (const event of raisedEvents) {
                    instance.actor.callEvent(instance, state, event);
                }
            }
        }

        for (const event of raisedEvents) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](this, state, event);
            }
        }
    }

    onDraw(callback: LayerLifecycleDrawCallback): void {
        this.onDrawCallback = callback;
    }

    callDraw(state: GameState, canvas: GameCanvas): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(this, state, canvas);
        }
    }
    
    onDestroy(callback: LayerLifecycleCallback): void {
        this.onDestroyCallback = callback;
    }

    callDestroy(state: GameState): void {
        if (this.onDestroyCallback) {
            this.onDestroyCallback(this, state);
        }
    }

    createInstance(actorName: string, x?: number, y?: number): ActorInstance {
        const instanceId = this.room.game.nextActorInstanceID();
        const actor = this.room.game.getActor(actorName);

        const newInstance = ActorInstance.spawn(instanceId, actor, x || 0, y || 0);

        if (!this.actorInstanceRegistryByActor[actorName]) {
            this.actorInstanceRegistryByActor[actorName] = [];
        }

        this.actorInstanceRegistryByActor[actorName].push(newInstance);
        this.actorInstanceRegistry[instanceId] = newInstance;

        return newInstance;
    }

    deleteInstance(instance: ActorInstance): void {
        delete this.actorInstanceRegistry[instance.id];
        this.actorInstanceRegistryByActor[instance.actor.name] = [];
    }

    getActorInstances(actorName?: string): ActorInstance[] {
        if (actorName) {
            return this.actorInstanceRegistryByActor[actorName] || [];
        }

        const instances: ActorInstance[] = [];

        for (const a in this.actorInstanceRegistry) {
            instances.push(this.actorInstanceRegistry[a]);
        }

        return instances;
    }

    
}