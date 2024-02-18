import { Game, GameError, GameState } from './../game';
import { Layer, LayerOptions, LayerStatus } from './layer';
import { RoomCamera } from './camera';

export enum RoomStatus {
    NotStarted = 'NotStarted',
    Starting = 'Starting',
    Resuming = 'Resuming',
    Running = 'Running',
    Suspended = 'Suspended',
}

type RoomLifecycleCallback = {
    (self: Room, state: GameState): void;
};

export type RoomOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export class Room {
    static readonly DefaultLayerName = 'default';

    private layerRegistry: { [name: string]: Layer } = {};

    private onStartCallback: RoomLifecycleCallback;
    private onResumeCallback: RoomLifecycleCallback;
    private onSuspendCallback: RoomLifecycleCallback;

    readonly camera: RoomCamera;
    readonly defaultLayer: Layer;
    readonly game: Game;
    readonly height: number;
    readonly name: string;
    readonly options: RoomOptions;
    readonly width: number;

    private _status: RoomStatus;
    get status() { return this._status; }

    static define(name: string, game: Game, options: RoomOptions = {}): Room {
        return new Room(name, game, options);
    }

    private constructor(name: string, game: Game, options: RoomOptions = {}) {
        this.name = name;
        this.game = game;

        this.options = options;
        this.options.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || game.canvas.height;
        this.width = options.width || game.canvas.width;

        this.camera = new RoomCamera(this);
        this.defaultLayer = this.createLayer(Room.DefaultLayerName);

        this._status = RoomStatus.NotStarted;
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

    onStart(callback: RoomLifecycleCallback): Room {
        this.onStartCallback = callback;
        return this;
    }

    start(state: GameState): void {
        if (this.onStartCallback) {
            this.onStartCallback(this, state);
        }

        this._status = RoomStatus.Running;
    }

    step(state: GameState): void {
        this.camera.updatePosition();

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

    onSuspend(callback: RoomLifecycleCallback): Room {
        this.onSuspendCallback = callback;
        return this;
    }

    suspend(state: GameState): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, state);
        }

        this._status = RoomStatus.Suspended;
    }

    onResume(callback: RoomLifecycleCallback): Room {
        this.onResumeCallback = callback;
        return this;
    }

    resume(state: GameState): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, state);
        }

        this._status = RoomStatus.Running;
    }

    createLayer(layerName: string, options: LayerOptions = {}): Layer {
        if (this.layerRegistry[layerName]) {
            throw new GameError((`Layer created with name that already exists: ${layerName}.`)); 
        }

        const layer: Layer = Layer.define(layerName, this, options);
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

    private deleteLayer(layer: Layer): void {
        if (this.layerRegistry[layer.name]) {
            delete this.layerRegistry[layer.name];
        }
        else {
            throw new GameError(`Attempted to delete Layer with name that does not exist: ${layer.name}`);
        }
    }

    private resetLayers(): void {
        for (const layerName in this.layerRegistry) {
            this.layerRegistry[layerName].init();
        }
    }
}
