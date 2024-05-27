import { Actor } from './../actor/actor';
import { Boundary } from './../actor/boundary';
import { ActorInstance, Instance } from './../actor/instance';
import { EntityLifecycleCb, EntityLifecycleDrawCb, EntityLifecycleGameEventCb, EntityLifecycleKeyboardEventCb, EntityLifecyclePointerEventCb, LifecycleEntity, LifecycleEntityExecution } from '../core/entity';
import { InstanceStatus, SceneStatus, SubSceneDisplayMode } from './../core/enum';
import { GameError } from './../core/error';
import { GameEvent, KeyboardInputEvent, PointerInputEvent } from './../core/events';
import { GameCanvas } from './../device/canvas';
import { Game } from './../game';
import { Sprite } from './../sprite/sprite';
import { Background, BackgroundOptions } from './background';
import { Camera, SceneCamera, SceneCameraOptions } from './camera';
import { SceneController } from './controller';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface GameScene extends LifecycleEntity<GameScene, GameScene>, LifecycleEntityExecution<GameScene> {
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
    onResume(callback: EntityLifecycleCb<GameScene>): GameScene;
    onStart(callback: EntityLifecycleCb<GameScene>): GameScene;
    onSuspend(callback: EntityLifecycleCb<GameScene>): GameScene;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundOptions): GameScene;
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
    readonly parent: GameScene;
    readonly scene: GameScene;
    readonly x: number = 0;
    readonly y: number = 0;

    constructor(id: number, parent: GameScene, subScene: GameScene, options: SubSceneOptions = {}) {
        this.id = id;
        this.parent = parent;
        this.scene = subScene;
        this.displayMode = options.displayMode || SubSceneDisplayMode.Embed;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    // TODO add: hide() mechanism
}

export class Scene implements GameScene {
    static readonly DefaultCameraName = 'default';

    private readonly cameraMap: { [name: string]: Camera } = {};
    private readonly subSceneMap: { [name: string]: SubScene } = {};
    private instanceMap: { [index: number]: Instance } = {};
    
    private gameEventHandlerMap: { [eventName: string]: EntityLifecycleGameEventCb<GameScene> } = {};
    private keyboardInputEventHandlerMap: { [type: string]: EntityLifecycleKeyboardEventCb<GameScene> } = {};
    private pointerInputEventHandlerMap: { [type: string]: EntityLifecyclePointerEventCb<GameScene> } = {};

    private onDrawCallback: EntityLifecycleDrawCb<GameScene>;
    private onLoadCallback: (actor: GameScene) => void;
    private onResumeCallback: EntityLifecycleCb<GameScene>;
    private onStartCallback: EntityLifecycleCb<GameScene>;
    private onStepCallback: EntityLifecycleCb<GameScene>;
    private onSuspendCallback: EntityLifecycleCb<GameScene>;

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

    static define(name: string, game: Game, options: SceneOptions = {}): GameScene {
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

    private drawSubScene(mainCanvas: GameCanvas, targetCanvas: GameCanvas, subScene: SubScene, sc: SceneController): void {
        const scene = <Scene>subScene.scene;
        const subSceneKey = this.getSubSceneCanvasKey(subScene);
        const embeddedSubSceneCanvas = mainCanvas.subCanvas(subSceneKey, { width: scene.width, height: scene.height });
        scene.draw(embeddedSubSceneCanvas, sc);
        targetCanvas.drawCanvas(embeddedSubSceneCanvas, 0, 0, scene.width, scene.height, subScene.x, subScene.y, scene.width, scene.height);
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

    handleGameEvent(self: GameScene, ev: GameEvent, sc: SceneController): void {
        if (ev.isCancelled) {
            return;
        }

        if (this.gameEventHandlerMap[ev.name]) {
            this.gameEventHandlerMap[ev.name](self, ev, sc);
        }
        
        for (const instance of this.getInstances()) {
            instance.handleGameEvent(instance, ev, sc);
        }

        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            scene.handleGameEvent(scene, ev, sc);
        }
    }

    handleKeyboardEvent(self: GameScene, ev: KeyboardInputEvent, sc: SceneController): void {
        if (ev.isCancelled) {
            return;
        }

        // propagate to instances.
        for (const instance of this.getInstances()) {
            instance.handleKeyboardEvent(instance, ev, sc);
        }

        // propagate to sub-scenes.
        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            scene.handleKeyboardEvent(scene, ev, sc);
        }

        // call scene handler.
        if (this.keyboardInputEventHandlerMap[ev.key]) {
            this.keyboardInputEventHandlerMap[ev.key](this, ev, sc);
        }
    }

    handlePointerEvent(self: GameScene, ev: PointerInputEvent, sc: SceneController): void {
        if (ev.isCancelled) {
            return;
        }

        // transform to secondary cameras first.
        let transformedEvent = null;
        for (const cameraName in this.cameraMap) {
            if (cameraName === Scene.DefaultCameraName) {
                continue;
            }

            const camera = this.getCamera(cameraName);
            if (camera.portContainsPosition(ev.x, ev.y)) {
                transformedEvent = this.scalePointerEventToCamera(ev, camera);
                break;
            }
        }

        // transform to default camera if necessary.
        if (!transformedEvent && this._defaultCamera.portContainsPosition(ev.x, ev.y)) {
            transformedEvent = this.scalePointerEventToCamera(ev, this._defaultCamera);
        }

        const propogatedEvent = transformedEvent || ev;

        // propagate to instances.
        for (const instance of this.getInstances()) {
            // TODO move "if" check to inside handlePointerEvent
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(propogatedEvent.x, propogatedEvent.y)) {
                instance.handlePointerEvent(instance, propogatedEvent, sc);
            }
        }

        // propagate to sub-scenes.
        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            if (subScene.displayMode === (SubSceneDisplayMode.Float)) {
                scene.handlePointerEvent(scene, propogatedEvent, sc);
            }
            else {
                const translatedEvent = propogatedEvent.translate(-subScene.x, -subScene.y);
                scene.handlePointerEvent(scene, translatedEvent, sc);
            }
            
        }

        // call scene handler.
        const handler: EntityLifecyclePointerEventCb<GameScene> = this.pointerInputEventHandlerMap[ev.type];

        if (handler) {
            handler(self, ev, sc);
        }
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

    load(): void {
        if (this.onLoadCallback) {
            this.onLoadCallback(this);
        }
    }

    onDraw(callback: EntityLifecycleDrawCb<GameScene>): GameScene {
        this.onDrawCallback = callback;
        return this;
    }

    onGameEvent(eventName: string, callback: EntityLifecycleGameEventCb<GameScene>): GameScene {
        this.gameEventHandlerMap[eventName] = callback;
        return this;
    }

    onKeyboardInput(key: string, callback: EntityLifecycleKeyboardEventCb<GameScene>): GameScene {
        this.keyboardInputEventHandlerMap[key] = callback;
        return this;
    }

    onLoad(callback: (actor: GameScene) => void): GameScene {
        this.onLoadCallback = callback;
        return this;
    }

    onPointerInput(type: string, callback: EntityLifecyclePointerEventCb<GameScene>): GameScene {
        this.pointerInputEventHandlerMap[type] = callback;
        return this;
    }

    onResume(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onResumeCallback = callback;
        return this;
    }

    onStart(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onStartCallback = callback;
        return this;
    }

    onStep(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onStepCallback = callback;
        return this;
    }

    onSuspend(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onSuspendCallback = callback;
        return this;
    }

    resume(sc: SceneController): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(this, sc);
        }

        this._status = SceneStatus.Running;
    }

    setBackground(colorOrSprite: string | Sprite, options: BackgroundOptions = {}): GameScene {
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

    step(sc: SceneController): void {

        for (const subScene of this.getSubScenes()) {
            const scene = <Scene>subScene.scene;
            scene.step(sc);
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
                instance.step(sc);
                instance.callAfterStepBehaviors(sc);
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
