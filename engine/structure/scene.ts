
import { RuntimeID } from './../core';
import { Background, BackgroundDrawOptions } from './../resources/background';
import { Sprite } from './../resources/sprite';
import { Controller, SceneController } from './../state/controller';
import { ActorInstanceOptions } from './../state/instance';
import { SceneState } from './../state/sceneState';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export type SceneActorPlacement = {
    actorName: string;
    options: ActorInstanceOptions;
};

export interface Scene extends LifecycleEntityBase<Scene, SceneState> {
    readonly name: string;
    readonly height: number;
    readonly persistent: boolean;
    readonly width: number;
    readonly background: Background;
    onResume(callback: EntityLifecycleCb<SceneState>): void;
    onStart(callback: EntityLifecycleCb<SceneState>): void;
    onSuspend(callback: EntityLifecycleCb<SceneState>): void;
    placeActor(actorName: string, options?: ActorInstanceOptions): void;
    // TODO methods for initializing camera, embeds
}

export class GameScene extends LifecycleEntityBase<Scene, SceneState> implements Scene {
    static readonly DefaultSceneHeight = 480;
    static readonly DefaultSceneWidth = 640;

    private readonly actorPlacements: SceneActorPlacement[] = [];

    private onResumeCallback: EntityLifecycleCb<SceneState>;
    private onStartCallback: EntityLifecycleCb<SceneState>;
    private onSuspendCallback: EntityLifecycleCb<SceneState>;

    readonly background: Background;
    readonly height: number;
    readonly name: string;
    readonly persistent: boolean;
    readonly width: number;

    static new(name: string, options: SceneOptions = {}): Scene {
        return new GameScene(name, options);
    }

    private constructor(name: string, options: SceneOptions = {}) {
        super();

        this.name = name;
        this.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || GameScene.DefaultSceneHeight;
        this.width = options.width || GameScene.DefaultSceneWidth;

        this.background = Background.createDefaultBackground(this.width, this.height);
    }

    callOnResume(self: SceneState, controller: Controller, data?: any): void {
        if (this.onResumeCallback) {
            this.onResumeCallback(self, controller, data);
        }
    }

    callOnStart(self: SceneState, controller: Controller, data?: any): void {
        if (this.onStartCallback) {
            this.onStartCallback(self, controller, data);
        }
    }

    callOnSuspend(self: SceneState, controller: Controller, data?: any): void {
        if (this.onSuspendCallback) {
            this.onSuspendCallback(self, controller, data);
        }
    }

    newState(controller: SceneController): SceneState {
        const sceneState = new SceneState(RuntimeID.next(), controller, this);
        // TODO: process SubScenePlacements, camera "constructs"(?) to initialize sceneState
        this.actorPlacements.forEach(placement => sceneState.instances.create(placement.actorName, placement.options));
        
        return sceneState;
    }

    onResume(callback: EntityLifecycleCb<SceneState>): void {
        this.onResumeCallback = callback;
    }

    onStart(callback: EntityLifecycleCb<SceneState>): void {
        this.onStartCallback = callback;
    }

    onSuspend(callback: EntityLifecycleCb<SceneState>): void {
        this.onSuspendCallback = callback;
    }

    // TODO needs testing
    placeActor(actorName: string, options: ActorInstanceOptions = {}): void {
        this.actorPlacements.push({ actorName: actorName, options: options});
    }
}