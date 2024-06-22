import { GameError, GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent, SceneEmbedDisplayMode, SceneStatus } from './../core';
import { GameCanvas } from './../device/canvas';
import { ActorInstance } from './../actorInstance';
import { Camera, SceneCamera, SceneCameraOptions } from './../camera';
import { Controller, SceneController } from './../controller';
import { GameScene, Scene } from './../scene';
import { SceneEmbedState } from './embedState';
import { SceneInstanceState } from './instanceState';

export class SceneState {
    static readonly DefaultCameraName = 'default';

    private readonly cameraMap: ObjMap<SceneCamera> = {};

    readonly embeds: SceneEmbedState;
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

        this.embeds = new SceneEmbedState(controller, this);
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

        this.embeds.forEach(embed => {
            if (embed.displayMode === SceneEmbedDisplayMode.Embed) {
                embed.draw(canvas, sceneCanvas, controller);
            }
        });

        this.instances.draw(sceneCanvas, <SceneController>controller);

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            const cameraCanvasKey = this.getCameraCanvasKey(camera);
            const cameraCanvas = canvas.subCanvas(cameraCanvasKey, { width: camera.width, height: camera.height });
            cameraCanvas.drawCanvas(sceneCanvas, camera.x, camera.y, camera.width, camera.height, 0, 0, camera.width, camera.height);
            canvas.drawCanvas(cameraCanvas, 0, 0, camera.width, camera.height, camera.portX, camera.portY, camera.portWidth, camera.portHeight);
        }

        this.scene.callDraw(this, canvas, controller);

        this.embeds.forEach(embed => {
            if (embed.displayMode === SceneEmbedDisplayMode.Float) {
                embed.draw(canvas, canvas, controller);
            }
        });
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

        this.scene.callGameEvent(this, event, controller);
        this.instances.forEach(instance => (<ActorInstance>instance).handleGameEvent(instance, event, controller));
        this.embeds.forEach(embed => embed.sceneState.handleGameEvent(event, controller));
    }

    handleKeyboardEvent(event: KeyboardInputEvent, controller: Controller): void {
        if (event.isCancelled) {
            return;
        }

        this.scene.callKeyboardEvent(this, event, controller);
        this.instances.forEach(instance => (<ActorInstance>instance).handleKeyboardEvent(instance, event, controller));
        this.embeds.forEach(embed => embed.sceneState.handleKeyboardEvent(event, controller));
    }

    handlePointerEvent(event: PointerInputEvent, controller: Controller): void {
        if (event.isCancelled) {
            return;
        }

        // transform to secondary cameras first.
        let transformedEvent = null;
        for (const cameraName in this.cameraMap) {
            if (cameraName === SceneState.DefaultCameraName) {
                continue;
            }

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

        // propagate to embedded scenes.
        this.embeds.getByDepth().forEach(embed => {
            if (event.isCancelled) {
                return;
            }
            if (embed.displayMode === (SceneEmbedDisplayMode.Float)) {
                if (embed.containsPosition(event.x, event.y)) {
                    const translatedFloatEvent = event.translate(-embed.x, -embed.y);
                    embed.sceneState.handlePointerEvent(translatedFloatEvent, controller);
                    event.cancel();
                }
            }
            else {
                const translatedEvent = propogatedEvent.translate(-embed.x, -embed.y);
                embed.sceneState.handlePointerEvent(translatedEvent, controller);
            }  
        });

        if (event.isCancelled) {
            return;
        }

        // propagate to instances.
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
        this.embeds.forEach(embed => embed.sceneState.startOrResume(controller, data));
    }

    step(controller: Controller): void {
        this.embeds.forEach(embed => embed.sceneState.step(controller));

        if (this.paused || this._status !== SceneStatus.Running) {
            return;
        }

        this.scene.callStep(this, controller);
        this.instances.step(<SceneController>controller);

        for (const cameraName in this.cameraMap) {
            const camera = this.cameraMap[cameraName];
            camera.updateFollowPosition();
        }
    }

    suspend(controller: Controller, data?: any): void {
        this._status = SceneStatus.Suspended;
        (<GameScene>this.scene).callOnSuspend(this, controller, data);
        this.embeds.forEach(embed => embed.sceneState.suspend(controller, data));
    }
}