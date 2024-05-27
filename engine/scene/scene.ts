import { Actor } from './../actor/actor';
import { Boundary } from './../actor/boundary';
import { ActorInstance, Instance } from './../actor/instance';
import { InstanceStatus, SceneStatus, SubSceneDisplayMode } from './../core/enum';
import { GameError } from './../core/error';
import { GameEvent } from './../core/event';
import { GameCanvas } from './../device/canvas';
import { KeyboardInputEvent } from './../device/keyboard';
import { PointerInputEvent } from './../device/pointer';
import { Game } from './../game';
import { Sprite } from './../sprite/sprite';
import { Background, BackgroundOptions } from './background';
import { Camera, SceneCamera, SceneCameraOptions } from './camera';
import { SceneController } from './controller';

type SceneLifecycleCallback = {
    (self: SceneDefinition, sc: SceneController): void;
};

type SceneLifecycleDrawCallback = {
    (self: SceneDefinition, canvas: GameCanvas, sc: SceneController): void;
};

type SceneKeyboardInputCallback = {
    (self: SceneDefinition, ev: KeyboardInputEvent, sc: SceneController): void;
};

type SceneLifecycleEventCallback = {
    (self: SceneDefinition, ev: GameEvent, sc: SceneController): void;
};

type ScenePointerInputCallback = {
    (self: SceneDefinition, ev: PointerInputEvent, sc: SceneController): void;
};

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface SceneDefinition {
    name: string;
    defaultCamera: SceneCamera;
    game: Game;
    height: number;
    status: SceneStatus;
    width: number;
    createInstance(actorName: string, x?: number, y?: number): ActorInstance;
    createInstancesFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[];
    defineCamera(cameraName: string, options?: SceneCameraOptions): SceneCamera;
    getInstances(actorName?: string): ActorInstance[];
    getInstancesAtPosition(x: number, y: number, solid?: boolean): ActorInstance[];
    getInstancesWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid?: boolean): ActorInstance[];
    isPositionFree(x: number, y: number, solid?: boolean): boolean;
    onDraw(callback: SceneLifecycleDrawCallback): SceneDefinition;
    onGameEvent(eventName: string, callback: SceneLifecycleEventCallback): SceneDefinition;
    onKeyboardInput(key: string, callback: SceneKeyboardInputCallback): SceneDefinition;
    onPointerInput(type: string, callback: ScenePointerInputCallback): SceneDefinition;
    onResume(callback: SceneLifecycleCallback): SceneDefinition;
    onStart(callback: SceneLifecycleCallback): SceneDefinition;
    onStep(callback: SceneLifecycleCallback): SceneDefinition;
    onSuspend(callback: SceneLifecycleCallback): SceneDefinition;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundOptions): SceneDefinition;
    showSubScene(sceneName: string, sc: SceneController, options?: SubSceneOptions): SubScene;
}

type SubSceneOptions = {
    displayMode?: SubSceneDisplayMode;
    x?: number;
    y?: number;
}

class SubScene {
    readonly id: number;
    readonly displayMode: SubSceneDisplayMode = SubSceneDisplayMode.Embed;
    readonly parent: SceneDefinition;
    readonly scene: SceneDefinition;
    readonly x: number = 0;
    readonly y: number = 0;

    constructor(id: number, parent: SceneDefinition, subScene: SceneDefinition, options: SubSceneOptions = {}) {
        this.id = id;
        this.parent = parent;
        this.scene = subScene;
        this.displayMode = options.displayMode || SubSceneDisplayMode.Embed;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    // TODO add: hide() mechanism
}

export class Scene implements SceneDefinition {
    static readonly DefaultCameraName = 'default';

    private readonly cameraMap: { [name: string]: Camera } = {};
    private readonly subSceneMap: { [name: string]: SubScene } = {};
    private instanceMap: { [index: number]: Instance } = {};
    
    private gameEventHandlerMap: { [eventName: string]: SceneLifecycleEventCallback } = {};
    private keyboardInputEventHandlerMap: { [type: string]: SceneKeyboardInputCallback } = {};
    private pointerInputEventHandlerMap: { [type: string]: ScenePointerInputCallback } = {};

    private onDrawCallback: SceneLifecycleDrawCallback;
    private onResumeCallback: SceneLifecycleCallback;
    private onStartCallback: SceneLifecycleCallback;
    private onStepCallback: SceneLifecycleCallback;
    private onSuspendCallback: SceneLifecycleCallback;

    private background: Background;

    private readonly _defaultCamera: Camera;
    get defaultCamera(): SceneCamera { return this._defaultCamera; }

    private _status: SceneStatus;
    get status() { return this._status; }

    readonly game: Game;
    readonly height: number;
    readonly name: string;
    readonly options: SceneOptions;
    readonly state: { [name: string]: unknown } = {};
    readonly width: number;

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
    }

    private deleteInstance(instance: ActorInstance): void {
        delete this.instanceMap[instance.id];
    }

    private getCameraCanvasSubKey(camera: Camera): string {
        return `${this.name}_${camera.name}`;
    }

    private getSubSceneCanvasKey(subScene: SubScene): string {
        return `${this.name}_${subScene.scene.name}_${subScene.id}`;
    }

    private getSubScenes(displayMode?: SubSceneDisplayMode): SubScene[] {
        const subScenes: SubScene[] = [];

        for (const a in this.subSceneMap) {
            const subScene = this.subSceneMap[a];
            if (!displayMode || displayMode === subScene.displayMode) {
                subScenes.push(this.subSceneMap[a]);
            }
        }

        return subScenes;
    }

    private scalePointerEventToCamera(event: PointerInputEvent, camera: Camera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
    }

    // TODO not needed?
    callGameEvent(ev: GameEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            if (this.gameEventHandlerMap[ev.name]) {
                this.gameEventHandlerMap[ev.name](this, ev, sc);
            }

            for (const subScene of this.getSubScenes()) {
                const scene = <Scene>subScene.scene;
                scene.callGameEvent(ev, sc);
            }
        }
    }

    callKeyboardInput(ev: KeyboardInputEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            const handler: SceneKeyboardInputCallback = this.keyboardInputEventHandlerMap[ev.key];

            if (handler) {
                handler(this, ev, sc);
            }

            // for (const subScene of this.getSubScenes()) {
            //     const scene = <Scene>subScene.scene;
            //     scene.callKeyboardInput(ev, sc);
            // }
        }
    }

    callPointerInput(ev: PointerInputEvent, sc: SceneController): void {
        if (!ev.isCancelled) {
            const handler: ScenePointerInputCallback = this.pointerInputEventHandlerMap[ev.type];

            if (handler) {
                handler(this, ev, sc);
            }
        }
    }

    createInstance(actorName: string, x?: number, y?: number): ActorInstance {
        const instanceId = this.game.nextSceneRuntimeID();
        const actor = <Actor>this.game.getActor(actorName);

        const spawnX = (x || 0);
        const spawnY = (y || 0);

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

    defineCamera(cameraName: string, options: SceneCameraOptions = {}): SceneCamera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = <Camera>Camera.define(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    private drawSubScene(mainCanvas: GameCanvas, targetCanvas: GameCanvas, subScene: SubScene, sc: SceneController): void {
        const scene = <Scene>subScene.scene;
        const subSceneKey = this.getSubSceneCanvasKey(subScene);
        const embeddedSubSceneCanvas = mainCanvas.subCanvas(subSceneKey, { width: scene.width, height: scene.height });
        scene.draw(embeddedSubSceneCanvas, sc);
        targetCanvas.drawCanvas(embeddedSubSceneCanvas, 0, 0, scene.width, scene.height, subScene.x, subScene.y, scene.width, scene.height);
    }

    draw(canvas: GameCanvas, sc: SceneController): void {
        const sceneCanvas = canvas.subCanvas('scene', { width: this.width, height: this.height });

        if (this.background) {
            this.background.draw(sceneCanvas);
        }

        for (const subScene of this.getSubScenes(SubSceneDisplayMode.Embed)) {
            this.drawSubScene(canvas, sceneCanvas, subScene, sc);
        }

        for (const instance of <Instance[]>this.getInstances()) {
            instance.draw(sceneCanvas, sc);
        }

        if (this.onDrawCallback) {
            this.onDrawCallback(this, canvas, sc);
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvasKey = this.getCameraCanvasSubKey(camera);
            const cameraCanvas = canvas.subCanvas(cameraCanvasKey, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
        }

        for (const subScene of this.getSubScenes(SubSceneDisplayMode.Float)) {
            this.drawSubScene(canvas, canvas, subScene, sc);
        }
    }

    getCamera(cameraName: string): Camera {
        if (!this.cameraMap[cameraName]) {
            throw new GameError((`Camera retrieved by name that does not exist: ${cameraName}.`)); 
        }

        return this.cameraMap[cameraName];
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

    

    init(): void {
        if (!this.options.persistent || this._status === SceneStatus.NotStarted) {
            // this.resetLayers();
            this.instanceMap = {};
            this._status = SceneStatus.Starting;
        }
        else { 
            this._status = SceneStatus.Resuming;
        }
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

    onDraw(callback: SceneLifecycleDrawCallback): SceneDefinition {
        this.onDrawCallback = callback;
        return this;
    }

    onGameEvent(eventName: string, callback: SceneLifecycleEventCallback): SceneDefinition {
        this.gameEventHandlerMap[eventName] = callback;
        return this;
    }

    onKeyboardInput(key: string, callback: SceneKeyboardInputCallback): SceneDefinition {
        this.keyboardInputEventHandlerMap[key] = callback;
        return this;
    }

    onPointerInput(type: string, callback: ScenePointerInputCallback): SceneDefinition {
        this.pointerInputEventHandlerMap[type] = callback;
        return this;
    }

    onResume(callback: SceneLifecycleCallback): SceneDefinition {
        this.onResumeCallback = callback;
        return this;
    }

    onStart(callback: SceneLifecycleCallback): SceneDefinition {
        this.onStartCallback = callback;
        return this;
    }

    onStep(callback: SceneLifecycleCallback): SceneDefinition {
        this.onStepCallback = callback;
        return this;
    }

    onSuspend(callback: SceneLifecycleCallback): SceneDefinition {
        this.onSuspendCallback = callback;
        return this;
    }

    propogateKeyboardEvent(ev: KeyboardInputEvent, sc: SceneController): void {
        for (const instance of this.getInstances()) {
            instance.actor.callKeyboardInput(instance, ev, sc);
        }

        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            scene.propogateKeyboardEvent(ev, sc);
        }

        this.callKeyboardInput(ev, sc);
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

        for (const instance of this.getInstances()) {
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(propogatedEvent.x, propogatedEvent.y)) {
                instance.actor.callPointerInput(instance, propogatedEvent, sc);
            }
        }

        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            if (subScene.displayMode === (SubSceneDisplayMode.Float)) {
                scene.propogatePointerEvent(propogatedEvent, sc);
            }
            else {
                const translatedEvent = propogatedEvent.translate(-subScene.x, -subScene.y);
                scene.propogatePointerEvent(translatedEvent, sc);
            }
            
        }

        this.callPointerInput(event, sc);
    }

    resume(sc: SceneController): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, sc);
        }

        this._status = SceneStatus.Running;
    }

    setBackground(colorOrSprite: string | Sprite, options: BackgroundOptions = {}): SceneDefinition {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(this, colorOrSprite, options);
        }
        else {
            this.background = Background.fromSprite(this, colorOrSprite, options);
        }

        return this;
    }

    showSubScene(sceneName: string, sc: SceneController, options: SubSceneOptions = {}): SubScene {
        const subSceneId = this.game.nextSceneRuntimeID();
        const scene = <Scene>this.game.getScene(sceneName);
        const subScene = new SubScene(subSceneId, this, scene, options);

        this.subSceneMap[`${sceneName}_${subSceneId}`] = subScene;

        // TODO: should this be done by the caller instead?
        scene.start(sc);

        return subScene;
    }

    start(sc: SceneController): void {
        if (this.onStartCallback) {
            this.onStartCallback(this, sc);
        }

        this._status = SceneStatus.Running;
    }

    step(events: GameEvent[], sc: SceneController): void {

        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            scene.step(events, sc);
        }

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
    }

    suspend(sc: SceneController): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, sc);
        }

        this._status = SceneStatus.Suspended;
    }
}
