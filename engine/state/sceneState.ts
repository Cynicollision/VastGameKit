import { GameError, GameEvent, GameTimer, GameTimerOptions, GameTimerSet, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneStatus } from './../core';
import { GameCanvas } from './../device/canvas';
import { GameScene, Scene } from './../structure/scene';
import { ActorInstance } from './instance';
import { Camera, SceneCamera, SceneCameraOptions } from './camera';
import { Controller, SceneController } from './controller';
import { SubScene, SubSceneOptions } from './subScene';
import { SceneSubSceneState } from './subSceneState';
import { SceneInstanceState } from './instanceState';

export class SceneState {
    static readonly DefaultCameraName = 'default';

    private readonly cameraMap: ObjMap<SceneCamera> = {};
    private readonly embeddedSubScenes: SceneSubSceneState;
    private readonly floatingSubScenes: SceneSubSceneState;
    private readonly timers = new GameTimerSet();
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

    private scalePointerEventToCamera(event: PointerInputEvent, camera: SceneCamera): PointerInputEvent {
        const position = camera.toScenePosition(event.x, event.y);
        return event.translate(position.x - event.x, position.y - event.y);
    }

    // The camera showing a canvas position: the first secondary camera whose port contains it, or else the default camera.
    private getCameraAt(x: number, y: number): SceneCamera {
        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            if (cameraName !== SceneState.DefaultCameraName && camera.portContainsPosition(x, y)) {
                return camera;
            }
        }

        return this._defaultCamera;
    }

    // Converts a canvas position, like the pointer's, to the Scene position shown there.
    toScenePosition(x: number, y: number): { x: number; y: number } {
        return this.getCameraAt(x, y).toScenePosition(x, y);
    }

    addCamera(cameraName: string, options: SceneCameraOptions = {}): Camera {
        if (this.cameraMap[cameraName]) {
            throw new GameError((`Camera defined with existing Camera name: ${cameraName}.`)); 
        }

        const camera = new SceneCamera(cameraName, this, options);
        this.cameraMap[cameraName] = camera;

        return camera;
    }

    // Draws the Scene through each Camera onto the Camera's port, then the Scene's onDraw and floating SubScenes over them.
    draw(canvas: GameCanvas, controller: Controller): void {
        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            canvas.pushView(camera.portX, camera.portY, camera.portWidth, camera.portHeight, camera.x, camera.y, camera.width, camera.height);

            this.scene.background.draw(canvas, camera);
            this.embeddedSubScenes.draw(canvas, <SceneController>controller, camera);
            this.instances.draw(canvas, <SceneController>controller, camera);

            canvas.popView();
        }

        this.scene.callDraw(this, canvas, controller);
        this.floatingSubScenes.draw(canvas, <SceneController>controller);
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

        // transform to the camera the event is in, if any.
        const camera = this.getCameraAt(event.x, event.y);
        const propogatedEvent = camera.portContainsPosition(event.x, event.y) ? this.scalePointerEventToCamera(event, camera) : event;
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

        this.timers.step();
        this.scene.callStep(this, controller);
        this.instances.step(<SceneController>controller);
        this.embeddedSubScenes.step(<SceneController>controller);

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updateFollowPosition();
        }
    }

    // starts a GameTimer that only ticks while this Scene is running and not paused.
    startTimer(options: GameTimerOptions): GameTimer {
        return this.timers.start(options);
    }

    suspend(controller: Controller, data?: any): void {
        this._status = SceneStatus.Suspended;
        (<GameScene>this.scene).callOnSuspend(this, controller, data);
        this.embeddedSubScenes.forEach(subScene => subScene.sceneState.suspend(controller, data));
        this.floatingSubScenes.forEach(subScene => subScene.sceneState.suspend(controller, data));
    }
}