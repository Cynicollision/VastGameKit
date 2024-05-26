import { ActorInstance } from './../actor/instance';
import { Geometry, MathUtil } from './../core';
import { Scene } from './scene';

export type SceneCameraOptions = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    portX?: number;
    portY?: number;
    portWidth?: number;
    portHeight?: number;
};

export type SceneCameraFollowOptions = {
    centerOnInstanceBoundary?: boolean;
    offsetX?: number;
    offsetY?: number;
    stayWithinScene?: boolean;
};

export class SceneCamera {
    private readonly _scene: Scene;
    private _followInstance: ActorInstance;
    private _followOptions: SceneCameraFollowOptions = {};
    readonly name: string;
    width: number = 0;
    height: number = 0;
    x: number = 0;
    y: number = 0;
    portX: number = 0;
    portY: number = 0;
    portWidth: number = 0;
    portHeight: number = 0;
    
    constructor(name: string, scene: Scene, options: SceneCameraOptions = {}) {
        this.name = name;
        this._scene = scene;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width ? options.width : scene.width;
        this.height = options.height ? options.height : scene.height;
        this.portX = options.portX ? options.portX : 0;
        this.portY = options.portY ? options.portY : 0;
        this.portWidth = options.portWidth ? options.portWidth : scene.width;
        this.portHeight = options.portHeight ? options.portHeight : scene.height;
    }

    portContainsPosition(x: number, y: number): boolean {
        return Geometry.rectangleContainsPosition(this.portX, this.portY, this.portWidth, this.portHeight, x, y);
    }

    follow(instance: ActorInstance, options: SceneCameraFollowOptions = {}): void {
        this._followInstance = instance;
        this._followOptions.centerOnInstanceBoundary = options.centerOnInstanceBoundary !== undefined ? options.centerOnInstanceBoundary : false;
        this._followOptions.offsetX = options.offsetX || 0;
        this._followOptions.offsetY = options.offsetY || 0;
        this._followOptions.stayWithinScene = options.stayWithinScene !== undefined ? options.stayWithinScene : true;
    }

    updatePosition(): void {
        if (!this._followInstance) {
            return;
        }

        const minXY = this._followOptions.stayWithinScene ? 0 : -Infinity;
        const maxX = this._followOptions.stayWithinScene ? this._scene.width - this._scene.game.canvas.width : Infinity;
        const maxY = this._followOptions.stayWithinScene ? this._scene.height - this._scene.game.canvas.height : Infinity;
        const center = this._followOptions.centerOnInstanceBoundary && this._followInstance.actor.boundary;
        const newX = center ? (this._followInstance.x - this._scene.game.canvas.width / 2 + this._followInstance.actor.boundary.width / 2) : this._followInstance.x;
        this.x = MathUtil.clamp(newX - this._followOptions.offsetX, minXY, maxX);
        const newY = center ? (this._followInstance.y - this._scene.game.canvas.height / 2 + this._followInstance.actor.boundary.height / 2) : this._followInstance.y;
        this.y = MathUtil.clamp(newY - this._followOptions.offsetY, minXY, maxY);
    }
}