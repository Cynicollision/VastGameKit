import { LayerStatus, SceneStatus } from './../core/enum';
import { GameError } from './../core/error';
import { GameEvent } from './../core/event';
import { GameCanvas } from './../device/canvas';
import { KeyboardInputEvent } from './../device/keyboard';
import { PointerInputEvent } from './../device/pointer';
import { Game } from './../game';
import { Camera, SceneCamera, SceneCameraOptions } from './camera';
import { SceneController } from './controller';
import { Layer, LayerOptions, SceneLayer } from './layer';

export type SceneLifecycleCallback = {
    (self: SceneDefinition, sc: SceneController): void;
};

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface SceneDefinition {
    name: string;
    defaultCamera: SceneCamera;
    defaultLayer: SceneLayer;
    game: Game;
    height: number;
    status: SceneStatus;
    width: number;
    defineCamera(cameraName: string, options?: SceneCameraOptions): SceneCamera;
    defineLayer(layerName: string, options?: LayerOptions): SceneLayer;
    onResume(callback: SceneLifecycleCallback): SceneDefinition;
    onStart(callback: SceneLifecycleCallback): SceneDefinition;
    onSuspend(callback: SceneLifecycleCallback): SceneDefinition;
}

export class Scene implements SceneDefinition {
    static readonly DefaultCameraName = 'default';
    static readonly DefaultLayerName = 'default';

    private readonly cameraMap: { [name: string]: Camera } = {};
    private readonly layerMap: { [name: string]: Layer } = {};

    private onStartCallback: SceneLifecycleCallback;
    private onResumeCallback: SceneLifecycleCallback;
    private onSuspendCallback: SceneLifecycleCallback;

    private readonly _defaultCamera: Camera;
    get defaultCamera(): SceneCamera { return this._defaultCamera; }

    private readonly _defaultLayer: Layer;
    get defaultLayer(): SceneLayer { return this._defaultLayer; }

    readonly game: Game;
    readonly height: number;
    readonly name: string;
    readonly options: SceneOptions;
    readonly width: number;

    private _status: SceneStatus;
    get status() { return this._status; }

    static define(name: string, game: Game, options: SceneOptions = {}): SceneDefinition {
        return new Scene(name, game, options);
    }

    private constructor(name: string, game: Game, options: SceneOptions = {}) {
        this.name = name;
        this.game = game;

        this._status = SceneStatus.NotStarted;

        this.options = options;
        this.options.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || game.canvas.height;
        this.width = options.width || game.canvas.width;

        this._defaultCamera = <Camera>this.defineCamera(Scene.DefaultCameraName);
        this._defaultLayer = <Layer>this.defineLayer(Scene.DefaultLayerName);
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

    private scalePointerEventToCamera(event: PointerInputEvent, camera: Camera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
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

    defineCamera(cameraName: string, options: SceneCameraOptions = {}): SceneCamera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = <Camera>Camera.define(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    defineLayer(layerName: string, options: LayerOptions = {}): SceneLayer {
        if (this.layerMap[layerName]) {
            throw new GameError((`Layer defined with existing Layer name: ${layerName}.`)); 
        }

        const layer = <Layer>Layer.define(layerName, this, options);
        this.layerMap[layerName] = layer;

        return layer;
    }

    destroyLayer(layerName: string): void {
        if (this.layerMap[layerName]) {
            this.layerMap[layerName].destroy();
        }
        else {
            throw new GameError(`Attempted to destroy Layer with name that does not exist: ${layerName}`);
        }
    }

    draw(canvas: GameCanvas, sc: SceneController): void {
        const sceneCanvas = canvas.subCanvas('scene', { width: this.width, height: this.height });

        for (const layer of this.getLayersSortedFromBottom()) {
            layer.draw(sceneCanvas, sc);
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvas = canvas.subCanvas(this.name + '_' + camera.name, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
        }
    }

    getCamera(cameraName: string): Camera {
        if (!this.cameraMap[cameraName]) {
            throw new GameError((`Camera retrieved by name that does not exist: ${cameraName}.`)); 
        }

        return this.cameraMap[cameraName];
    }

    getLayer(layerName: string): Layer {
        if (!this.layerMap[layerName]) {
            throw new GameError((`Layer retrieved by name that does not exist: ${layerName}.`)); 
        }

        return this.layerMap[layerName];
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

    onResume(callback: SceneLifecycleCallback): SceneDefinition {
        this.onResumeCallback = callback;
        return this;
    }

    onStart(callback: SceneLifecycleCallback): SceneDefinition {
        this.onStartCallback = callback;
        return this;
    }

    onSuspend(callback: SceneLifecycleCallback): SceneDefinition {
        this.onSuspendCallback = callback;
        return this;
    }

    propogateKeyboardEvent(event: KeyboardInputEvent, sc: SceneController): void {
        for (const layer of this.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                instance.actor.callKeyboardInput(instance, event, sc);
            }
        }
    }

    propogatePointerEvent(event: PointerInputEvent, sc: SceneController): void {
        let translatedEvent = null; // TODO: better handling of camera "priority"
        for (const cameraName in this.cameraMap) {
            if (cameraName === Scene.DefaultCameraName) {
                continue;
            }

            const camera = this.getCamera(cameraName);
            if (camera.portContainsPosition(event.x, event.y)) {
                translatedEvent = this.scalePointerEventToCamera(event, camera);
                break;
            }
        }

        if (!translatedEvent && this._defaultCamera.portContainsPosition(event.x, event.y)) {
            translatedEvent = this.scalePointerEventToCamera(event, this._defaultCamera);
        }

        const propogatedEvent = translatedEvent || event;
        for (const layer of this.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(layer.x + instance.x, layer.y + instance.y).containsPosition(propogatedEvent.x, propogatedEvent.y)) {
                    instance.actor.callPointerInput(instance, propogatedEvent, sc);
                }
            }
        }
    }

    resume(sc: SceneController): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, sc);
        }

        this._status = SceneStatus.Running;
    }

    start(sc: SceneController): void {
        if (this.onStartCallback) {
            this.onStartCallback(this, sc);
        }

        this._status = SceneStatus.Running;
    }

    step(events: GameEvent[], sc: SceneController): void {
        if (this._status === SceneStatus.Suspended) {
            return;
        }
        else if (this._status === SceneStatus.Starting) {
            this.start(sc);
            return;
        }
        else if (this._status === SceneStatus.Resuming) { 
            this.resume(sc);
            return;
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updatePosition();
        }

        for (const layer of this.getLayersSortedFromBottom()) {
            if (layer.status === LayerStatus.Destroyed) {
                layer.callDestroy(sc);
                this.deleteLayer(layer);
            }
            else if (layer.status === LayerStatus.New) {
                layer.activate();
                layer.callCreate(sc);
            }
            else {
                layer.step(events, sc);
            }
        }
    }

    suspend(sc: SceneController): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, sc);
        }

        this._status = SceneStatus.Suspended;
    }
}
