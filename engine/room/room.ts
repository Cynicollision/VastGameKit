import { ActorInstance } from './../actor';
import { Game, GameError, GameState } from './../game';
import { Layer, LayerLifecycleEventCallback, LayerOptions, LayerStatus } from './layer';

interface RoomLifecycleCallback {
    (self: Room, state: GameState): void;
}

export interface RoomOptions {
    persistent?: boolean;
}

export enum RoomStatus {
    NotStarted = 'NotStarted',
    Starting = 'Starting',
    Resuming = 'Resuming',
    Running = 'Running',
    Suspended = 'Suspended',
}

export class RoomView {
    x: number = 0;
    y: number = 0;

    private _followingInstance: ActorInstance;
    get followingInstance() { return this._followingInstance; }

    follow(instance: ActorInstance): void {
        this._followingInstance = instance;
    }
}

export class Room {
    static readonly DefaultLayerName = 'default';

    private layerRegistry: { [name: string]: Layer } = {};

    private onStartCallback: RoomLifecycleCallback;
    private onResumeCallback: RoomLifecycleCallback;
    private onSuspendCallback: RoomLifecycleCallback;

    private readonly _name: string;
    get name() { return this._name; }

    private readonly _game: Game;
    get game() { return this._game; }

    // private _state: GameState;
    // get state() { return this._state; }

    private readonly _options: RoomOptions;
    get options() { return this._options; }

    private _status: RoomStatus;
    get status() { return this._status; }

    private _defaultLayer: Layer;
    get defaultLayer() { return this._defaultLayer; }

    private _view: RoomView;
    get view() { return this._view; }

    static define(name: string, game: Game, options?: RoomOptions): Room {
        const room: Room = new Room(name, game, options);
        room._defaultLayer = room.createLayer(Room.DefaultLayerName);
        room._status = RoomStatus.NotStarted;

        return room;
    }

    private constructor(name: string, game: Game, options?: RoomOptions) {
        this._name = name;
        this._game = game;
        this._options = options || {};
        this._options.persistent = options !== undefined ? options.persistent : false;
        
        this._view = new RoomView();
    }

    init(): void {
        if (!this.options.persistent || this._status === RoomStatus.NotStarted) {
            this.resetLayers();
            this._status = RoomStatus.Starting;
        }
        else { 
            this._status = RoomStatus.Resuming;
        }
    }

    step(state: GameState): void {

        for (const layer of this.getLayersSortedFromBottom()) {
            if (layer.status === LayerStatus.Destroyed) {
                layer.callDestroy(state);
                this.deleteLayer(layer);
            }
            else if (layer.status === LayerStatus.New) {
                layer.activate();
                layer.callCreate(state);
            }
            else {
                layer.step(state);
            }
        }
    }

    onStart(callback: RoomLifecycleCallback): void {
        this.onStartCallback = callback;
    }

    start(state: GameState): void {
        if (this.onStartCallback) {
            this.onStartCallback(this, state);
        }

        this._status = RoomStatus.Running;
    }

    onGameEvent(eventName: string, callback: LayerLifecycleEventCallback): void {
        this.defaultLayer.onGameEvent(eventName, callback);
    }

    onSuspend(callback: RoomLifecycleCallback): void {
        this.onSuspendCallback = callback;
    }

    suspend(state: GameState): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, state);
        }

        this._status = RoomStatus.Suspended;
    }

    onResume(callback: RoomLifecycleCallback): void {
        this.onResumeCallback = callback;
    }

    resume(state: GameState): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, state);
        }

        this._status = RoomStatus.Running;
    }

    createLayer(layerName: string, options?: LayerOptions): Layer {
        if (this.layerRegistry[layerName]) {
            throw new GameError((`Layer created with name that already exists: ${layerName}.`)); 
        }

        const layer: Layer = Layer.define(this, layerName, options);
        this.layerRegistry[layerName] = layer;

        return layer;
    }

    getLayer(layerName: string): Layer {
        if (!this.layerRegistry[layerName]) {
            throw new GameError((`Layer retrieved by name that does not exist: ${layerName}.`)); 
        }

        return this.layerRegistry[layerName];
    }

    destroyLayer(layerName: string): void {
        if (this.layerRegistry[layerName]) {
            this.layerRegistry[layerName].destroy();
        }
        else {
            throw new GameError(`Attempted to destroy Layer with name that does not exist: ${layerName}`);
        }
    }

    private deleteLayer(layer: Layer): void {
        if (this.layerRegistry[layer.name]) {
            delete this.layerRegistry[layer.name];
        }
        else {
            throw new GameError(`Attempted to delete Layer with name that does not exist: ${layer.name}`);
        }
    }

    resetLayers(): void {
        for (const layerName in this.layerRegistry) {
            this.layerRegistry[layerName].init();
        }
    }

    getLayers(): Layer[] {
        const layers: Layer[] = [];

        for (const layerName in this.layerRegistry) {
            layers.push(this.layerRegistry[layerName]);
        }

        return layers;
    }

    getLayersSortedFromBottom(): Layer[] {
        return this.getLayers().sort((a, b) => b.depth - a.depth);
    }

    getLayersSortedFromTop(): Layer[] {
        return this.getLayers().sort((a, b) => a.depth - b.depth);
    }

    createInstance(actorName: string, x: number, y: number): ActorInstance {
        return this._defaultLayer.createInstance(actorName, x, y);
    }
}
