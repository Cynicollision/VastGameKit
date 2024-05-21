import { ActorInstance } from './../actor';
import { MathUtil } from './../core';
import { Scene } from './scene';

export type SceneCameraOptions = {
    centerOnInstanceBoundary?: boolean;
    offsetX?: number;
    offsetY?: number;
    stayWithinScene?: boolean;
};

export class SceneCamera {
    private readonly _scene: Scene;
    private _followingInstance: ActorInstance;
    private _options: SceneCameraOptions = {};

    private _x: number = 0;
    get x() { return this._x; }
    
    private _y: number = 0;
    get y() { return this._y; }

    constructor(scene: Scene) {
        this._scene = scene;
    }

    follow(instance: ActorInstance, options: SceneCameraOptions = {}): void {
        this._followingInstance = instance;
        this._options = options;
        this._options.centerOnInstanceBoundary = this._options.centerOnInstanceBoundary !== undefined ? this._options.centerOnInstanceBoundary : false;
        this._options.offsetX = this._options.offsetX || 0;
        this._options.offsetY = this._options.offsetY || 0;
        this._options.stayWithinScene = this._options.stayWithinScene !== undefined ? this._options.stayWithinScene : true;
    }

    updatePosition(): void {
        if (!this._followingInstance) {
            return;
        }

        const minXY = this._options.stayWithinScene ? 0 : -Infinity;
        const maxX = this._options.stayWithinScene ? this._scene.width - this._scene.game.canvas.width : Infinity;
        const maxY = this._options.stayWithinScene ? this._scene.height - this._scene.game.canvas.height : Infinity;

        const center = this._options.centerOnInstanceBoundary && this._followingInstance.actor.boundary;

        const newX = center ? (this._followingInstance.x - this._scene.game.canvas.width / 2 + this._followingInstance.actor.boundary.width / 2) : this._followingInstance.x;
        this._x = MathUtil.clamp(newX - this._options.offsetX, minXY, maxX);

        const newY = center ? (this._followingInstance.y - this._scene.game.canvas.height / 2 + this._followingInstance.actor.boundary.height / 2) : this._followingInstance.y;
        this._y = MathUtil.clamp(newY - this._options.offsetY, minXY, maxY);
    }
}