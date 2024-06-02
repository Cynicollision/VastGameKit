import { Geometry, MathUtil } from './core';
import { FollowEntityOptions, PositionedEntity } from './entity';
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

export interface SceneCamera extends PositionedEntity {
    name: string
    portX: number;
    portY: number;
    portWidth: number;
    portHeight: number;
    follow(target: PositionedEntity, options?: FollowEntityOptions): void;
}

export class Camera implements SceneCamera {
    private readonly _scene: Scene;
    private _followTarget: PositionedEntity;
    private _followOptions: FollowEntityOptions = {};

    readonly name: string;
    height: number = 0;
    portX: number = 0;
    portY: number = 0;
    portWidth: number = 0;
    portHeight: number = 0;
    width: number = 0;
    x: number = 0;
    y: number = 0;

    static new(cameraName: string, scene: Scene, options: SceneCameraOptions = {}): SceneCamera {
        return new Camera(cameraName, scene, options);
    }
    
    private constructor(name: string, scene: Scene, options: SceneCameraOptions = {}) {
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

    follow(target: PositionedEntity, options: FollowEntityOptions = {}): void {
        this._followTarget = target;
        this._followOptions.centerOnTarget = options.centerOnTarget !== undefined ? options.centerOnTarget : false;
        this._followOptions.offsetX = options.offsetX || 0;
        this._followOptions.offsetY = options.offsetY || 0;
    }

    portContainsPosition(x: number, y: number): boolean {
        return Geometry.rectangleContainsPosition(this.portX, this.portY, this.portWidth, this.portHeight, x, y);
    }

    updateFollowPosition(): void {
        if (!this._followTarget) {
            return;
        }

        const width = this._scene.game.canvas.width - this.portX;
        const newX = this._followOptions.centerOnTarget ? (this._followTarget.x - width / 2 + this._followTarget.width / 2) : this._followTarget.x;
        this.x = MathUtil.clamp(newX - this._followOptions.offsetX, 0, this._scene.width - width);

        const height = this._scene.game.canvas.height - this.portY;
        const newY = this._followOptions.centerOnTarget ? (this._followTarget.y - height / 2 + this._followTarget.height / 2) : this._followTarget.y;
        this.y = MathUtil.clamp(newY - this._followOptions.offsetY, 0, this._scene.height - height);
    }
}