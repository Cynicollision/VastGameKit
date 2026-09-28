import { Geometry } from './../core';
import { GameCanvas } from './../device/canvas';
import { Controller } from './controller';
import { SceneState } from './sceneState';

export type SubSceneOptions = {
    depth?: number;
    height?: number;
    width?: number;
    x?: number;
    y?: number;
}

export class SubScene {
    readonly id: number;
    readonly sceneState: SceneState;
    readonly depth: number = 0;
    readonly height: number;
    readonly width: number;
    readonly x: number = 0;
    readonly y: number = 0;

    private _isDestroyed: boolean = false;
    get isDestroyed() { return this._isDestroyed; }

    get sceneName(): string {
        return this.sceneState.scene.name;
    }

    constructor(id: number, thisSceneState: SceneState, options: SubSceneOptions = {}) {
        this.id = id;
        this.sceneState = thisSceneState;
        this.depth = options.depth !== undefined ? options.depth : 0;
        this.height = options.height || thisSceneState.scene.height;
        this.width = options.width || thisSceneState.scene.width;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    containsPosition(x: number, y: number): boolean {
        return Geometry.rectangleContainsPosition(this.x, this.y, this.width, this.height, x, y);
    }

    destroy(): void {
        this._isDestroyed = true;
    }

    draw(canvas: GameCanvas, controller: Controller): void {
        canvas.pushView(this.x, this.y, this.width, this.height);
        this.sceneState.draw(canvas, controller);
        canvas.popView();
    }
}