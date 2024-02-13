import { ActorInstance, ActorInstanceStatus } from './../actor';
import { RoomCamera } from './camera';
import { GameCanvas, PointerInputEvent } from './../device';
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
    (self: Layer, state: GameState, event: KeyboardEvent): void;
};

type LayerPointerInputCallback = {
    (self: Layer, state: GameState, event: PointerInputEvent): void;
};

type LayerLifecycleDrawCallback = {
    (self: Layer, state: GameState, canvas: GameCanvas): void;
};

export type LayerOptions = {
    depth?: number;
    height?: number;
    width?: number;
    visible?: boolean;
    x?: number;
    y?: number;
};

export class Layer {
    private actorInstanceRegistry: { [index: number]: ActorInstance } = {};
    private actorInstanceRegistryByActor: { [actorName: string]: ActorInstance[] } = {};

    private gameEventHandlerRegistry: { [eventName: string]: LayerLifecycleEventCallback } = {};
    private keyboardInputEventHandlerRegistry: { [type: string]: LayerKeyboardInputCallback } = {};
    private pointerInputEventHandlerRegistry: { [type: string]: LayerPointerInputCallback } = {};

    private onCreateCallback: LayerLifecycleCallback;
    private onStepCallback: LayerLifecycleCallback;
    private onDrawCallback: LayerLifecycleDrawCallback;
    private onDestroyCallback: LayerLifecycleCallback;

    private backgroundColor: string = '#fff';
    private backgroundSprite: Sprite;
    private followOffsetX: number;
    private followOffsetY: number;

    readonly name: string;
    readonly room: Room;

    depth: number;
    height: number;
    width: number;
    visible: boolean; // TODO implement (control whether this layer is drawn)
    x: number;
    y: number;

    private _status: LayerStatus;
    get status() { return this._status; }

    private _followingCamera: RoomCamera;
    get followingCamera() { return this._followingCamera; }
    
    static define(layerName: string, room: Room, options: LayerOptions = {}): Layer {
        const layer = new Layer(layerName, room);
        layer.init();

        layer.depth = options.depth || 0;
        layer.height = options.height || room.height;
        layer.width = options.width || room.width;
        layer.visible = options.visible || true;
        layer.x = options.x || 0;
        layer.y = options.y || 0;

        return layer;
    }

    private constructor(name: string, room: Room) {
        this.name = name;
        this.room = room;
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

        if (!event.isCancelled) {
            if (this.gameEventHandlerRegistry[event.name]) {
                this.gameEventHandlerRegistry[event.name](this, state, event);
            }
        }
    }

    onPointerInput(type: string, callback: LayerPointerInputCallback): void {
        this.pointerInputEventHandlerRegistry[type] = callback;
    }

    callPointerInput(state: GameState, event: PointerInputEvent): void {
        if (!event.isCancelled) {
            const handler: LayerPointerInputCallback = this.pointerInputEventHandlerRegistry[event.type];
            if (handler) {
                handler(this, state, event);
            }
        }
    }

    onKeyboardInput(key: string, callback: LayerKeyboardInputCallback): void {
        this.keyboardInputEventHandlerRegistry[key] = callback;
    }

    callKeyboardInput(state: GameState, event: KeyboardEvent): void {
        const handler: LayerKeyboardInputCallback = this.keyboardInputEventHandlerRegistry[event.key];
        if (handler) {
            handler(this, state, event);
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

        this.updatePosition();
    }

    private updatePosition(): void {
        if (this._followingCamera) {
            this.x = this._followingCamera.x + this.followOffsetX;
            this.y = this._followingCamera.y + this.followOffsetY;
        }
    }

    onDraw(callback: LayerLifecycleDrawCallback): void {
        this.onDrawCallback = callback;
    }

    draw(state: GameState, canvas: GameCanvas): void {
        if (this.backgroundSprite) {
            canvas.drawSprite(this.backgroundSprite, this.x, this.y, { repeatHeight: this.height, repeatWidth: this.width, repeatX: true, repeatY: true });
        }
        else if (this.backgroundColor) {
            canvas.fillArea(this.backgroundColor, this.x, this.y, this.width, this.height);
        }
        
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
    
    setBackground(colorOrSprite: string | Sprite): void {
        if (typeof colorOrSprite === 'string') {
            this.backgroundColor = colorOrSprite;
        }
        else {
            this.backgroundSprite = colorOrSprite;
        }
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
