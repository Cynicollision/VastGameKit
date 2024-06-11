
import { GameError, GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneEmbedDisplayMode, SceneStatus } from './core';
import { GameCanvas } from './device/canvas';
import { ActorInstance } from './actorInstance';
import { Background, BackgroundDrawOptions } from './background';
import { SceneCamera, Camera, SceneCameraOptions } from './camera';
import { Controller } from './controller';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';
import { GameResources } from './resources';
import { SceneEmbed } from './scene/embed';
import { SceneEmbedState } from './scene/embedState';
import { SceneInstanceState } from './scene/instanceState';
import { Sprite } from './sprite';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface Scene extends LifecycleEntityBase<Scene> {
    readonly name: string;
    readonly defaultCamera: Camera;
    readonly embeds: SceneEmbedState;
    readonly height: number;
    readonly instances: SceneInstanceState;
    readonly state: ObjMap<any>;
    readonly status: SceneStatus;
    readonly width: number;
    defineCamera(cameraName: string, options?: SceneCameraOptions): Camera;
    onLoad(callback: (scene: Scene) => void);
    onResume(callback: EntityLifecycleCb<Scene>): void;
    onStart(callback: EntityLifecycleCb<Scene>): void;
    onSuspend(callback: EntityLifecycleCb<Scene>): void;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundDrawOptions): void;
}

export class GameScene extends LifecycleEntityBase<Scene> implements Scene {
    static readonly DefaultCameraName = 'default';
    static readonly DefaultSceneHeight = 480;
    static readonly DefaultSceneWidth = 640;

    private readonly cameraMap: ObjMap<SceneCamera> = {};
    private background: Background;
    private onLoadCallback: (self: Scene) => void;
    private onResumeCallback: EntityLifecycleCb<Scene>;
    private onStartCallback: EntityLifecycleCb<Scene>;
    private onSuspendCallback: EntityLifecycleCb<Scene>;

    private readonly _defaultCamera: SceneCamera;
    get defaultCamera(): Camera { return this._defaultCamera; }

    private _status: SceneStatus;
    get status() { return this._status; }

    readonly embeds: SceneEmbedState;
    readonly height: number;
    readonly instances: SceneInstanceState;
    readonly name: string;
    readonly options: SceneOptions;
    readonly state: ObjMap<any> = {};
    readonly width: number;

    static new(name: string, resources: GameResources, options: SceneOptions = {}): Scene {
        return new GameScene(name, resources, options);
    }

    private constructor(name: string,  resources: GameResources, options: SceneOptions = {}) {
        super();

        this.name = name;
        this._status = SceneStatus.NotStarted;
        this.options = options;
        this.options.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || GameScene.DefaultSceneHeight;
        this.width = options.width || GameScene.DefaultSceneWidth;

        this._defaultCamera = <SceneCamera>this.defineCamera(GameScene.DefaultCameraName);
        this.embeds = new SceneEmbedState(resources, this);
        this.instances = new SceneInstanceState(resources);
    }

    private drawSceneEmbed(mainCanvas: GameCanvas, targetCanvas: GameCanvas, embed: SceneEmbed, sc: Controller): void {
        const scene = <GameScene>embed.scene;
        const embedKey = this.getSceneEmbedCanvasKey(embed);
        const embeddedSceneCanvas = mainCanvas.subCanvas(embedKey, { width: scene.width, height: scene.height });
        scene.draw(embeddedSceneCanvas, sc);
        targetCanvas.drawCanvas(embeddedSceneCanvas, 0, 0, scene.width, scene.height, embed.x, embed.y, scene.width, scene.height);
    }

    private getCameraCanvasKey(camera: SceneCamera): string {
        return `${this.name}_${camera.name}`;
    }

    private getSceneEmbedCanvasKey(embed: SceneEmbed): string {
        return `${this.name}_${embed.scene.name}_${embed.id}`;
    }

    private scalePointerEventToCamera(event: PointerInputEvent, camera: SceneCamera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
    }

    defineCamera(cameraName: string, options: SceneCameraOptions = {}): Camera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = SceneCamera.new(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    draw(canvas: GameCanvas, controller: Controller): void {
        const sceneCanvas = canvas.subCanvas('scene', { width: this.width, height: this.height });

        if (this.background) {
            this.background.draw(sceneCanvas);
        }

        for (const embed of this.embeds.getAll(SceneEmbedDisplayMode.Embed)) {
            this.drawSceneEmbed(canvas, sceneCanvas, embed, controller);
        }

        this.instances.draw(sceneCanvas, controller)

        if (this.onDrawCallback) {
            this.onDrawCallback(this, sceneCanvas, controller);
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvasKey = this.getCameraCanvasKey(camera);
            const cameraCanvas = canvas.subCanvas(cameraCanvasKey, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);

            // debug - TODO make a param somehow
            sceneCanvas.drawRect('#F00', camera.x + 2, camera.y + 2, camera.width - 4, camera.height - 4);
        }

        for (const embed of this.embeds.getAll(SceneEmbedDisplayMode.Float)) {
            this.drawSceneEmbed(canvas, canvas, embed, controller);
        }
    }

    getCamera(cameraName: string): SceneCamera {
        if (!this.cameraMap[cameraName]) {
            throw new GameError((`Camera retrieved by name that does not exist: ${cameraName}.`)); 
        }

        return this.cameraMap[cameraName];
    }

    handleGameEvent(ev: GameEvent, sc: Controller): void {
        if (ev.isCancelled) {
            return;
        }

        if (this.gameEventHandlerMap[ev.name]) {
            this.gameEventHandlerMap[ev.name](this, ev, sc);
        }

        this.instances.forEach((instance: ActorInstance) => {
            instance.handleGameEvent(instance, ev, sc);
        });

        for (const embed of this.embeds.getAll()) {
            (<GameScene>embed.scene).handleGameEvent(ev, sc);
        }
    }

    handleKeyboardEvent(ev: KeyboardInputEvent, sc: Controller): void {
        if (ev.isCancelled) {
            return;
        }

        // propagate to instances.
        for (const instance of this.instances.getAll()) {
            (<ActorInstance>instance).handleKeyboardEvent(instance, ev, sc);
        }

        // propagate to embedded scenes.
        for (const embed of this.embeds.getAll()) {
            (<GameScene>embed.scene).handleKeyboardEvent(ev, sc);
        }

        // call scene handler.
        if (this.keyboardInputEventHandlerMap[ev.key]) {
            this.keyboardInputEventHandlerMap[ev.key](this, ev, sc);
        }
    }

    handlePointerEvent(ev: PointerInputEvent, sc: Controller): void {
        if (ev.isCancelled) {
            return;
        }

        // transform to secondary cameras first.
        let transformedEvent = null;
        for (const cameraName in this.cameraMap) {
            if (cameraName === GameScene.DefaultCameraName) {
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
        for (const instance of <ActorInstance[]>this.instances.getAll()) {
            instance.handlePointerEvent(instance, propogatedEvent, sc);
        }

        // propagate to embedded scenes.
        for (const embed of this.embeds.getAll()) {
            if (embed.displayMode === (SceneEmbedDisplayMode.Float)) {
                if (embed.containsPosition(ev.x, ev.y)) {
                    (<GameScene>embed.scene).handlePointerEvent(propogatedEvent, sc);
                }
            }
            else {
                const translatedEvent = propogatedEvent.translate(-embed.x, -embed.y);
                (<GameScene>embed.scene).handlePointerEvent(translatedEvent, sc);
            }  
        }

        // call scene handler.
        if (this.pointerInputEventHandlerMap[ev.type]) {
            this.pointerInputEventHandlerMap[ev.type](this, ev, sc);
        }
    }

    load(): void {
        // TODO: anything "internal" to do here?
        if (this.onLoadCallback) {
            this.onLoadCallback(this);
        }
    }

    onLoad(callback: (scene: Scene) => void): void {
        this.onLoadCallback = callback;
    }

    onResume(callback: EntityLifecycleCb<Scene>): void {
        this.onResumeCallback = callback;
    }

    onStart(callback: EntityLifecycleCb<Scene>): void {
        this.onStartCallback = callback;
    }

    onSuspend(callback: EntityLifecycleCb<Scene>): void {
        this.onSuspendCallback = callback;
    }

    setBackground(colorOrSprite: string | Sprite, drawOptions: BackgroundDrawOptions = {}): Scene {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }
        else {
            this.background = Background.fromSprite(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }

        return this;
    }

    startOrResume(sc: Controller): void {

        if (this._status === SceneStatus.NotStarted) {
            if (this.onStartCallback) {
                this.onStartCallback(this, sc);
            }
        }
        else if (this._status === SceneStatus.Suspended) {
            if (this.onResumeCallback) {
                this.onResumeCallback(this, sc);
            }
        }

        this._status = SceneStatus.Running;

        for (const embed of this.embeds.getAll()) {
            (<GameScene>embed.scene).startOrResume(sc);
        }
    }

    step(sc: Controller): void {
        this.embeds.forEach(embed => (<GameScene>embed.scene).step(sc));

        if (this._status !== SceneStatus.Running) {
            return;
        }

        if (this.onStepCallback) {
            this.onStepCallback(this, sc);
        }

        this.instances.step(sc);

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updateFollowPosition();
        }
    }

    suspend(sc: Controller): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(this, sc);
        }

        this._status = SceneStatus.Suspended;

        for (const embed of this.embeds.getAll()) {
            (<GameScene>embed.scene).suspend(sc);
        }
    }
}