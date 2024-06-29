import { GameError, GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneStatus } from './../core';
import { GameCanvas } from './../device/canvas';
import { ActorInstance } from './../actorInstance';
import { Camera, SceneCamera, SceneCameraOptions } from './../camera';
import { Controller, SceneController } from './../controller';
import { GameScene, Scene } from './../scene';
import { SubScene, SubSceneOptions } from './subScene';
import { SceneSubSceneState } from './sceneSubSceneState';
import { SceneInstanceState } from './sceneInstanceState';

export class SceneState {
    static readonly DefaultCameraName = 'default';

    private readonly cameraMap: ObjMap<SceneCamera> = {};
    private readonly embeddedSubScenes: SceneSubSceneState;
    private readonly floatingSubScenes: SceneSubSceneState;
    readonly instances: SceneInstanceState;
    readonly id: number;
    readonly scene: Scene;
    readonly state: ObjMap<any> = {};
    
    private readonly _defaultCamera: SceneCamera;
    get defaultCamera(): Camera { return this._defaultCamera; }

    private _status: SceneStatus;
    get status() { return this._status; }

    paused: boolean = false;

    constructor(id: number, controller: SceneController, scene: Scene) {
        this.id = id;

        this.embeddedSubScenes = new SceneSubSceneState(controller);
        this.floatingSubScenes = new SceneSubSceneState(controller);
        this.instances = new SceneInstanceState(controller);
        this.scene = scene;

        this._status = SceneStatus.NotStarted;
        this._defaultCamera = <SceneCamera>this.addCamera(SceneState.DefaultCameraName);
    }

    private getCameraCanvasKey(camera: SceneCamera): string {
        return `${this.scene.name}_${this.id}_${camera.name}`;
    }

    private scalePointerEventToCamera(event: PointerInputEvent, camera: SceneCamera): PointerInputEvent {
        const translatedEvent = event.translate(-camera.portX, -camera.portY);

        translatedEvent.x *= (camera.width / camera.portWidth);
        translatedEvent.y *= (camera.height / camera.portHeight);

        translatedEvent.x += camera.x;
        translatedEvent.y += camera.y;

        return translatedEvent;
    }

    addCamera(cameraName: string, options: SceneCameraOptions = {}): Camera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = new SceneCamera(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    draw(canvas: GameCanvas, controller: Controller): void {
        const sceneCanvas = canvas.subCanvas('scene', { width: this.scene.width, height: this.scene.height });

        if (this.scene.background) {
            this.scene.background.draw(sceneCanvas);
        }

        this.embeddedSubScenes.draw(canvas, sceneCanvas, <SceneController>controller);
        this.instances.draw(sceneCanvas, <SceneController>controller);

        // TODO: Camera.draw(scenCanvas)
        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvasKey = this.getCameraCanvasKey(camera);
            const cameraCanvas = canvas.subCanvas(cameraCanvasKey, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
        }

        this.scene.callDraw(this, canvas, controller);
        this.floatingSubScenes.draw(canvas, canvas, <SceneController>controller);
    }

    embedSubScene(sceneName: string, options: SubSceneOptions = {}): SubScene {
        return this.embeddedSubScenes.create(sceneName, options)
    }

    floatSubScene(sceneName: string, options: SubSceneOptions = {}): SubScene {
        return this.floatingSubScenes.create(sceneName, options)
    }

    getCamera(cameraName: string): SceneCamera {
        if (!this.cameraMap[cameraName]) {
            throw new GameError((`Camera retrieved by name that does not exist: ${cameraName}.`)); 
        }

        return this.cameraMap[cameraName];
    }

    handleGameEvent(event: GameEvent, controller: Controller): void {
        if (event.isCancelled) {
            return;
        }

        this.floatingSubScenes.forEach(subScene => subScene.sceneState.handleGameEvent(event, controller));
        this.scene.callGameEvent(this, event, controller);

        if (!this.paused) {
            this.embeddedSubScenes.forEach(subScene => subScene.sceneState.handleGameEvent(event, controller));
            this.instances.forEach(instance => (<ActorInstance>instance).handleGameEvent(instance, event, controller));
        }
    }

    handleKeyboardEvent(event: KeyboardInputEvent, controller: Controller): void {
        if (event.isCancelled) {
            return;
        }

        this.floatingSubScenes.forEach(subScene => subScene.sceneState.handleKeyboardEvent(event, controller));
        this.scene.callKeyboardEvent(this, event, controller);

        if (!this.paused) {
            this.embeddedSubScenes.forEach(subScene => subScene.sceneState.handleKeyboardEvent(event, controller));
            this.instances.forEach(instance => (<ActorInstance>instance).handleKeyboardEvent(instance, event, controller));
        }
    }

    handlePointerEvent(event: PointerInputEvent, controller: Controller): void {
        // pass to floating sub scenes first.
        this.floatingSubScenes.handlePointerEvent(event, <SceneController>controller);

        if (this.paused || event.isCancelled) {
            return;
        }

        // transform to secondary cameras first.
        let transformedEvent = null;
        for (const cameraName in this.cameraMap) {
            if (cameraName === SceneState.DefaultCameraName) {
                continue;
            }

            // TODO: camera.handlePointerEvent
            const camera = this.getCamera(cameraName);
            if (camera.portContainsPosition(event.x, event.y)) {
                transformedEvent = this.scalePointerEventToCamera(event, camera);
                break;
            }
        }

        // transform to default camera if not already transformed to a secondary camera.
        if (!transformedEvent && this._defaultCamera.portContainsPosition(event.x, event.y)) {
            transformedEvent = this.scalePointerEventToCamera(event, this._defaultCamera);
        }

        const propogatedEvent = transformedEvent || event;
        this.embeddedSubScenes.handlePointerEvent(propogatedEvent, <SceneController>controller);
        
        this.instances.forEach(instance => (<ActorInstance>instance).handlePointerEvent(instance, propogatedEvent, controller));
        this.scene.callPointerEvent(this, event, controller);
    }

    startOrResume(controller: Controller, data = {}): void {
        if (this._status === SceneStatus.NotStarted) {
            (<GameScene>this.scene).callOnStart(this, controller, data);
        }
        else if (this._status === SceneStatus.Suspended) {
            (<GameScene>this.scene).callOnResume(this, controller, data);
        }

        this._status = SceneStatus.Running;

        // TODO probably unnecessary/redundant
        //this.embeddedSubScenes.forEach(embed => embed.sceneState.startOrResume(controller, data));
        //this.floatingSubScenes.forEach(embed => embed.sceneState.startOrResume(controller, data));
    }

    step(controller: Controller): void {
        this.floatingSubScenes.step(<SceneController>controller);

        if (this.paused || this._status !== SceneStatus.Running) {
            return;
        }

        this.scene.callStep(this, controller);
        this.instances.step(<SceneController>controller);
        this.embeddedSubScenes.step(<SceneController>controller);

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updateFollowPosition();
        }
    }

    suspend(controller: Controller, data?: any): void {
        this._status = SceneStatus.Suspended;
        (<GameScene>this.scene).callOnSuspend(this, controller, data);
        this.embeddedSubScenes.forEach(subScene => subScene.sceneState.suspend(controller, data));
        this.floatingSubScenes.forEach(subScene => subScene.sceneState.suspend(controller, data));
    }
}