
import { RuntimeID } from './core';
import { Background, BackgroundDrawOptions } from './background';
import { Controller, SceneController } from './controller';
import { EntityLifecycleCb, LifecycleEntityBase } from './entity';
import { Sprite } from './sprite';
import { SceneState } from './scene/sceneState';
import { ActorInstanceOptions } from './actorInstance';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export type SceneActorPlacement = {
    actorName: string;
    x: number;
    y: number;
    options?: ActorInstanceOptions;
};

export interface Scene extends LifecycleEntityBase<Scene, SceneState> {
    readonly name: string;
    readonly height: number;
    readonly persistent: boolean;
    readonly width: number;
    background: Background;
    // TODO: 'placeActor' or similar
    onResume(callback: EntityLifecycleCb<SceneState>): void;
    onStart(callback: EntityLifecycleCb<SceneState>): void;
    onSuspend(callback: EntityLifecycleCb<SceneState>): void;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundDrawOptions): void;
}

export class GameScene extends LifecycleEntityBase<Scene, SceneState> implements Scene {
    static readonly DefaultSceneHeight = 480;
    static readonly DefaultSceneWidth = 640;

    private onResumeCallback: EntityLifecycleCb<SceneState>;
    private onStartCallback: EntityLifecycleCb<SceneState>;
    private onSuspendCallback: EntityLifecycleCb<SceneState>;

    readonly height: number;
    readonly name: string;
    readonly persistent: boolean;
    readonly width: number;
    background: Background;

    static new(name: string, options: SceneOptions = {}): Scene {
        return new GameScene(name, options);
    }

    private constructor(name: string, options: SceneOptions = {}) {
        super();

        this.name = name;
        this.persistent = options !== undefined ? options.persistent : false;
        this.height = options.height || GameScene.DefaultSceneHeight;
        this.width = options.width || GameScene.DefaultSceneWidth;
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
        // TODO: process ActorPlacements, EmbedPlacements, camera "constructs"(?), "pass" to sceneState
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

    setBackground(colorOrSprite: string | Sprite, drawOptions: BackgroundDrawOptions = {}): Scene {
        if (typeof colorOrSprite === 'string') {
            this.background = Background.fromColor(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }
        else {
            this.background = Background.fromSprite(colorOrSprite, { height: this.height, width: this.width }, drawOptions);
        }

        return this;
    }
}