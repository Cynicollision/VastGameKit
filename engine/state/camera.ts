import { Geometry, MathUtil } from './../core';
import { FollowEntityOptions, PositionedEntity } from './../structure/entity';
import { SceneState } from './sceneState';

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

export interface Camera extends PositionedEntity {
    readonly name: string
    portX: number;
    portY: number;
    portWidth: number;
    portHeight: number;
    follow(target: PositionedEntity, options?: FollowEntityOptions): void;
}

export class SceneCamera implements Camera {
    private readonly _sceneState: SceneState;
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

    constructor(name: string, sceneState: SceneState, options: SceneCameraOptions = {}) {
        this.name = name;
        this._sceneState = sceneState;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width ? options.width : sceneState.scene.width;
        this.height = options.height ? options.height : sceneState.scene.height;
        this.portX = options.portX ? options.portX : 0;
        this.portY = options.portY ? options.portY : 0;
        this.portWidth = options.portWidth ? options.portWidth : sceneState.scene.width;
        this.portHeight = options.portHeight ? options.portHeight : sceneState.scene.height;
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

        let newX = this._followTarget.x;
        let newY = this._followTarget.y;

        if (this._followOptions.centerOnTarget) {
            newX -= this.width / 2 - this._followTarget.width / 2;
            newY -= this.height / 2 - this._followTarget.height / 2;
        }

        this.x = MathUtil.clamp(newX - this._followOptions.offsetX, 0, this._sceneState.scene.width - this.width);
        this.y = MathUtil.clamp(newY - this._followOptions.offsetY, 0, this._sceneState.scene.height - this.height);
    }
}