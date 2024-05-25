import { Game, GameController, GameError } from './../game';
import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { Layer, LayerOptions, LayerStatus } from './layer';
import { SceneCamera } from './camera';
import { SceneCameraOptions } from '.';

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
    static readonly DefaultCameraName = 'default';
    static readonly DefaultLayerName = 'default';

    private layerMap: { [name: string]: Layer } = {};

    private onStartCallback: SceneLifecycleCallback;
    private onResumeCallback: SceneLifecycleCallback;
    private onSuspendCallback: SceneLifecycleCallback;

    readonly cameras: SceneCamera[] = [];

    readonly defaultCamera: SceneCamera;
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

        // TODO: rename createLayer -> layer, etc. - keep 'destroy'
        this.defaultCamera = this.camera(Scene.DefaultCameraName);
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

    camera(name: string, options: SceneCameraOptions = {}): SceneCamera {
        if (this.cameras[name]) {
            return this.cameras[name];
        }

        const camera = new SceneCamera(name, this, options);
        this.cameras[name] = camera;

        return camera;
    }

    // TODO: layer(), layers()

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

    propogateKeyboardEvent(gc: GameController, event: KeyboardInputEvent): void {
        for (const layer of this.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                instance.actor.callKeyboardInput(instance, gc, event);
            }
        }
    }

    propogatePointerEvent(gc: GameController, event: PointerInputEvent): void {

        // TODO: better handling of camera "priority"
        let translatedEvent = null;
        for (const cameraName in this.cameras) {
            if (cameraName === Scene.DefaultCameraName) {
                continue;
            }

            const camera = this.camera(cameraName);
            if (camera.portContainsPosition(event.x, event.y)) {
                translatedEvent = this.scalePointerEventToCamera(event, camera);
                break;
            }
        }

        if (!translatedEvent && this.defaultCamera.portContainsPosition(event.x, event.y)) {
            translatedEvent = this.scalePointerEventToCamera(event, this.defaultCamera);
        }

        const propogateEvent = translatedEvent || event;

        for (const layer of this.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(layer.x + instance.x, layer.y + instance.y).containsPosition(propogateEvent.x, propogateEvent.y)) {
                    instance.actor.callPointerInput(instance, gc, propogateEvent);
                }
            }
        }
    }

    private scalePointerEventToCamera(event: PointerInputEvent, camera: SceneCamera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
    }

    step(gc: GameController): void {

        for (const cameraName in this.cameras) {
            const camera = this.cameras[cameraName];
            camera.updatePosition();
        }

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
        canvas.clear();

        const sceneCanvas = canvas.subCanvas('scene', { width: this.width, height: this.height });
        sceneCanvas.clear();

        for (const layer of this.getLayersSortedFromBottom()) {
            layer.draw(gc, sceneCanvas);
        }

        for (const cameraName in this.cameras) {
            const camera = this.cameras[cameraName];
            const cameraCanvas = canvas.subCanvas(this.name + '_' + camera.name, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, this.width, this.height, 0, 0, this.width, this.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
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
