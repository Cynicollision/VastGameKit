
import { Boundary, GameError, GameEvent, InstanceStatus, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneEmbedDisplayMode, SceneStatus } from './core';
import { GameCanvas } from './device/canvas';
import { Actor } from './actor';
import { ActorInstance, ActorInstanceOptions, Instance } from './actorInstance';
import { Background, BackgroundDrawOptions } from './background';
import { Camera, SceneCamera, SceneCameraOptions } from './camera';
import { SceneController } from './controller';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';
import { Game } from './game';
import { SceneEmbed, SceneEmbedOptions } from './sceneEmbed';
import { Sprite } from './sprite';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface GameScene extends LifecycleEntityBase<GameScene> {
    name: string;
    defaultCamera: SceneCamera;
    game: Game;
    height: number;
    status: SceneStatus;
    width: number;
    createInstance(actorName: string, options?: ActorInstanceOptions): ActorInstance;
    createInstancesFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[];
    createSceneEmbed(sceneName: string, options?: SceneEmbedOptions): SceneEmbed;
    defineCamera(cameraName: string, options?: SceneCameraOptions): SceneCamera;
    getInstances(actorName?: string): ActorInstance[];
    getInstancesAtPosition(x: number, y: number, solid?: boolean): ActorInstance[];
    getInstancesWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid?: boolean): ActorInstance[];
    isPositionFree(x: number, y: number, solid?: boolean): boolean;
    onResume(callback: EntityLifecycleCb<GameScene>): GameScene;
    onStart(callback: EntityLifecycleCb<GameScene>): GameScene;
    onSuspend(callback: EntityLifecycleCb<GameScene>): GameScene;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundDrawOptions): GameScene;
}

export class Scene extends LifecycleEntityBase<GameScene> implements GameScene {
    static readonly DefaultCameraName = 'default';

    private onResumeCallback: EntityLifecycleCb<GameScene>;
    private onStartCallback: EntityLifecycleCb<GameScene>;
    private onSuspendCallback: EntityLifecycleCb<GameScene>;

    private readonly cameraMap: ObjMap<Camera> = {};
    private readonly sceneEmbedMap: ObjMap<SceneEmbed> = {};
    private instanceMap: ObjMap<Instance> = {};
    
    private background: Background;

    private readonly _defaultCamera: Camera;
    get defaultCamera(): SceneCamera { return this._defaultCamera; }

    private _status: SceneStatus;
    get status() { return this._status; }

    readonly game: Game;
    readonly height: number;
    readonly name: string;
    readonly options: SceneOptions;
    readonly state: ObjMap<any> = {};
    readonly width: number;

    static new(name: string, game: Game, options: SceneOptions = {}): GameScene {
        return new Scene(name, game, options);
    }

    private constructor(name: string, game: Game, options: SceneOptions = {}) {
        super();
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

    private drawSceneEmbed(mainCanvas: GameCanvas, targetCanvas: GameCanvas, embed: SceneEmbed, sc: SceneController): void {
        const scene = <Scene>embed.scene;
        const embedKey = this.getSceneEmbedCanvasKey(embed);
        const embeddedSceneCanvas = mainCanvas.subCanvas(embedKey, { width: scene.width, height: scene.height });
        scene.draw(embeddedSceneCanvas, sc);
        targetCanvas.drawCanvas(embeddedSceneCanvas, 0, 0, scene.width, scene.height, embed.x, embed.y, scene.width, scene.height);
    }

    private getCameraCanvasKey(camera: Camera): string {
        return `${this.name}_${camera.name}`;
    }

    private getSceneEmbeds(displayMode?: SceneEmbedDisplayMode): SceneEmbed[] {
        const embeds: SceneEmbed[] = [];

        for (const a in this.sceneEmbedMap) {
            const embed = this.sceneEmbedMap[a];
            if (!displayMode || displayMode === embed.displayMode) {
                embeds.push(this.sceneEmbedMap[a]);
            }
        }

        return embeds;
    }

    private getSceneEmbedCanvasKey(embed: SceneEmbed): string {
        return `${this.name}_${embed.scene.name}_${embed.id}`;
    }

    private scalePointerEventToCamera(event: PointerInputEvent, camera: Camera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
    }

    createInstance(actorName: string, options?: ActorInstanceOptions): ActorInstance {
        const instanceId = this.game.controller.getNextRuntimeID();
        const actor = <Actor>this.game.getActor(actorName);

        const newInstance = <Instance>Instance.spawn(instanceId, actor, options);
        this.instanceMap[instanceId] = newInstance;

        return newInstance;
    }

    createInstancesFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[] {
        const instances = [];

        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                const actorName = instanceKey[map[i][j]];
                if (actorName) {
                    instances.push(this.createInstance(actorName, { x: j * gridSize, y: i * gridSize }));
                }
            }
        }

        return instances;
    }

    createSceneEmbed(sceneName: string, options: SceneEmbedOptions = {}): SceneEmbed {
        const sceneEmbedId = this.game.controller.getNextRuntimeID();
        const subScene = <Scene>this.game.getScene(sceneName);
        const embed = new SceneEmbed(sceneEmbedId, this, subScene, options);

        this.sceneEmbedMap[`${sceneName}_${sceneEmbedId}`] = embed;

        subScene.startOrResume(this.game.controller);

        return embed;
    }

    defineCamera(cameraName: string, options: SceneCameraOptions = {}): SceneCamera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = <Camera>Camera.new(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    draw(canvas: GameCanvas, sc: SceneController): void {
        const sceneCanvas = canvas.subCanvas('scene', { width: this.width, height: this.height });

        if (this.background) {
            this.background.draw(sceneCanvas);
        }

        for (const embed of this.getSceneEmbeds(SceneEmbedDisplayMode.Embed)) {
            this.drawSceneEmbed(canvas, sceneCanvas, embed, sc);
        }

        for (const instance of <Instance[]>this.getInstancesByDepth()) {
            instance.draw(sceneCanvas, sc);
        }

        if (this.onDrawCallback) {
            this.onDrawCallback(this, canvas, sc);
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvasKey = this.getCameraCanvasKey(camera);
            const cameraCanvas = canvas.subCanvas(cameraCanvasKey, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
        }

        for (const embed of this.getSceneEmbeds(SceneEmbedDisplayMode.Float)) {
            this.drawSceneEmbed(canvas, canvas, embed, sc);
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

    getInstancesByDepth(actorName?: string): ActorInstance[] {
        return this.getInstances(actorName).sort((a, b) => { return b.depth - a.depth; });
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

    handleGameEvent(ev: GameEvent, sc: SceneController): void {
        if (ev.isCancelled) {
            return;
        }

        if (this.gameEventHandlerMap[ev.name]) {
            this.gameEventHandlerMap[ev.name](this, ev, sc);
        }
        
        for (const instance of this.getInstances()) {
            (<Instance>instance).handleGameEvent(instance, ev, sc);
        }

        for (const embed of this.getSceneEmbeds()) {
            (<Scene>embed.scene).handleGameEvent(ev, sc);
        }
    }

    handleKeyboardEvent(ev: KeyboardInputEvent, sc: SceneController): void {
        if (ev.isCancelled) {
            return;
        }

        // propagate to instances.
        for (const instance of this.getInstances()) {
            (<Instance>instance).handleKeyboardEvent(instance, ev, sc);
        }

        // propagate to embedded scenes.
        for (const embed of this.getSceneEmbeds()) {
            (<Scene>embed.scene).handleKeyboardEvent(ev, sc);
        }

        // call scene handler.
        if (this.keyboardInputEventHandlerMap[ev.key]) {
            this.keyboardInputEventHandlerMap[ev.key](this, ev, sc);
        }
    }

    handlePointerEvent(ev: PointerInputEvent, sc: SceneController): void {
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
        for (const instance of <Instance[]>this.getInstances()) {
            instance.handlePointerEvent(instance, propogatedEvent, sc);
        }

        // propagate to embedded scenes.
        for (const embed of this.getSceneEmbeds()) {
            if (embed.displayMode === (SceneEmbedDisplayMode.Float)) {
                if (embed.containsPosition(ev.x, ev.y)) {
                    (<Scene>embed.scene).handlePointerEvent(propogatedEvent, sc);
                }
            }
            else {
                const translatedEvent = propogatedEvent.translate(-embed.x, -embed.y);
                (<Scene>embed.scene).handlePointerEvent(translatedEvent, sc);
            }  
        }

        // call scene handler.
        if (this.pointerInputEventHandlerMap[ev.type]) {
            this.pointerInputEventHandlerMap[ev.type](this, ev, sc);
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
        // TODO: anything "internal" to do here?
        if (this.onLoadCallback) {
            this.onLoadCallback(this);
        }
    }

    onResume(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onResumeCallback = callback;
        return this;
    }

    onStart(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onStartCallback = callback;
        return this;
    }

    onSuspend(callback: EntityLifecycleCb<GameScene>): GameScene {
        this.onSuspendCallback = callback;
        return this;
    }

    setBackground(colorOrSprite: string | Sprite, drawOptions: BackgroundDrawOptions = {}): GameScene {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }
        else {
            this.background = Background.fromSprite(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }

        return this;
    }

    startOrResume(sc: SceneController): void {

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
    }

    step(sc: SceneController): void {

        for (const embed of this.getSceneEmbeds()) {
            (<Scene>embed.scene).step(sc);
        }

        if (this._status !== SceneStatus.Running) {
            return;
        }

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updateFollowPosition();
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