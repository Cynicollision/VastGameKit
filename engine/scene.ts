
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
import { SceneState } from './scene/sceneState';

export type SceneOptions = {
    height?: number;
    persistent?: boolean;
    width?: number;
};

export interface Scene extends LifecycleEntityBase<Scene, SceneState> {
    readonly name: string;
    readonly height: number;
    readonly persistent: boolean;
    readonly width: number;
    background: Background;
    onLoad(callback: (scene: Scene) => void);
    onResume(callback: EntityLifecycleCb<SceneState>): void;
    onStart(callback: EntityLifecycleCb<SceneState>): void;
    onSuspend(callback: EntityLifecycleCb<SceneState>): void;
    setBackground(colorOrSprite: string | Sprite, options?: BackgroundDrawOptions): void;
}

export class GameScene extends LifecycleEntityBase<Scene, SceneState> implements Scene {
    static readonly DefaultSceneHeight = 480;
    static readonly DefaultSceneWidth = 640;

    private onLoadCallback: (self: Scene) => void;
    private onResumeCallback: EntityLifecycleCb<SceneState>;
    private onStartCallback: EntityLifecycleCb<SceneState>;
    private onSuspendCallback: EntityLifecycleCb<SceneState>;

    readonly height: number;
    readonly name: string;
    readonly persistent: boolean;
    readonly width: number;
    background: Background;

    static new(name: string, resources: GameResources, options: SceneOptions = {}): Scene {
        return new GameScene(name, resources, options);
    }

    private constructor(name: string,  resources: GameResources, options: SceneOptions = {}) {
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

    load(): void {
        // TODO: anything "internal" to do here?
        if (this.onLoadCallback) {
            this.onLoadCallback(this);
        }
    }

    onLoad(callback: (scene: Scene) => void): void {
        this.onLoadCallback = callback;
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