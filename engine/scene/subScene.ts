import { RectBoundary } from './../core/boundaries';
import { GameCanvas } from './../device/canvas';
import { Controller } from './../controller';
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

    private getSubSceneCanvasKey(): string {
        return `${this.sceneState.scene.name}_${this.id}`;
    }

    containsPosition(x: number, y: number): boolean {
        return new RectBoundary(this.width, this.height).atPosition(this.x, this.y).containsPosition(x, y);
    }

    destroy(): void {
        this._isDestroyed = true;
    }

    draw(mainCanvas: GameCanvas, targetCanvas: GameCanvas, controller: Controller): void {
        const subSceneKey = this.getSubSceneCanvasKey();
        const subSceneCanvas = mainCanvas.subCanvas(subSceneKey, { width: this.width, height: this.height });
        this.sceneState.draw(subSceneCanvas, controller);
        targetCanvas.drawCanvas(subSceneCanvas, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
    }
}