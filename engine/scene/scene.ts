import { Game, GameController, GameError } from './../game';
import { GameCanvas } from './../device';
import { Layer, LayerOptions, LayerStatus } from './layer';
import { SceneCamera } from './camera';

export enum SceneStatus {
    NotStarted = 'NotStarted',
    Starting = 'Starting',
    Resuming = 'Resuming',
    Running = 'Running',
    Suspended = 'Suspended',
}

export type SceneLifecycleCallback = {
    (self: Scene, gc: GameController): void;
};

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export class Scene {
    static readonly DefaultLayerName = 'default';

    private layerMap: { [name: string]: Layer } = {};

    private onStartCallback: SceneLifecycleCallback;
    private onResumeCallback: SceneLifecycleCallback;
    private onSuspendCallback: SceneLifecycleCallback;

    readonly camera: SceneCamera;
    readonly defaultLayer: Layer;
    readonly game: Game;
    readonly height: number;
    readonly name: string;
    readonly options: SceneOptions;
    readonly width: number;

    private _status: SceneStatus;
    get status() { return this._status; }

    static define(name: string, game: Game, options: SceneOptions = {}): Scene {
        return new Scene(name, game, options);
    }

    private constructor(name: string, game: Game, options: SceneOptions = {}) {
        this.name = name;
        this.game = game;

        this.options = options;
        this.options.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || game.canvas.height;
        this.width = options.width || game.canvas.width;

        this.camera = new SceneCamera(this);
        this.defaultLayer = this.createLayer(Scene.DefaultLayerName);

        this._status = SceneStatus.NotStarted;
    }

    init(): void {
        if (!this.options.persistent || this._status === SceneStatus.NotStarted) {
            this.resetLayers();
            this._status = SceneStatus.Starting;
        }
        else { 
            this._status = SceneStatus.Resuming;
        }
    }

    onStart(callback: SceneLifecycleCallback): Scene {
        this.onStartCallback = callback;
        return this;
    }

    start(gc: GameController): void {
        if (this.onStartCallback) {
            this.onStartCallback(this, gc);
        }

        this._status = SceneStatus.Running;
    }

    step(gc: GameController): void {
        this.camera.updatePosition();

        for (const layer of this.getLayersSortedFromBottom()) {
            if (layer.status === LayerStatus.Destroyed) {
                layer.callDestroy(gc);
                this.deleteLayer(layer);
            }
            else if (layer.status === LayerStatus.New) {
                layer.activate();
                layer.callCreate(gc);
            }
            else {
                layer.step(gc);
            }
        }
    }

    draw(gc: GameController, canvas: GameCanvas): void {
        canvas.setOrigin(-this.camera.x, -this.camera.y);
        canvas.clear();

        for (const layer of this.getLayersSortedFromBottom()) {
            layer.draw(gc, canvas);
            for (const instance of layer.getInstances()) {
                instance.draw(gc, canvas);
            }
        }
    }

    onSuspend(callback: SceneLifecycleCallback): Scene {
        this.onSuspendCallback = callback;
        return this;
    }

    suspend(gc: GameController): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, gc);
        }

        this._status = SceneStatus.Suspended;
    }

    onResume(callback: SceneLifecycleCallback): Scene {
        this.onResumeCallback = callback;
        return this;
    }

    resume(gc: GameController): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, gc);
        }

        this._status = SceneStatus.Running;
    }

    createLayer(layerName: string, options: LayerOptions = {}): Layer {
        if (this.layerMap[layerName]) {
            throw new GameError((`Layer created with name that already exists: ${layerName}.`)); 
        }

        const layer: Layer = Layer.define(layerName, this, options);
        this.layerMap[layerName] = layer;

        return layer;
    }

    getLayer(layerName: string): Layer {
        if (!this.layerMap[layerName]) {
            throw new GameError((`Layer retrieved by name that does not exist: ${layerName}.`)); 
        }

        return this.layerMap[layerName];
    }

    destroyLayer(layerName: string): void {
        if (this.layerMap[layerName]) {
            this.layerMap[layerName].destroy();
        }
        else {
            throw new GameError(`Attempted to destroy Layer with name that does not exist: ${layerName}`);
        }
    }

    getLayers(): Layer[] {
        const layers: Layer[] = [];

        for (const layerName in this.layerMap) {
            layers.push(this.layerMap[layerName]);
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
        if (this.layerMap[layer.name]) {
            delete this.layerMap[layer.name];
        }
        else {
            throw new GameError(`Attempted to delete Layer with name that does not exist: ${layer.name}`);
        }
    }

    private resetLayers(): void {
        for (const layerName in this.layerMap) {
            this.layerMap[layerName].init();
        }
    }
}
