import { SceneEmbedDisplayMode } from './../core';
import { GameCanvas } from './../device/canvas';
import { Controller } from './../controller';
import { SceneState } from './sceneState';

export type SceneEmbedOptions = {
    depth?: number;
    displayMode?: SceneEmbedDisplayMode;
    height?: number;
    width?: number;
    x?: number;
    y?: number;
}

export class SceneEmbed {
    readonly id: number;
    readonly displayMode: SceneEmbedDisplayMode = SceneEmbedDisplayMode.Embed;
    readonly parentSceneState: SceneState;
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

    constructor(id: number, parentSceneState: SceneState, thisSceneState: SceneState, options: SceneEmbedOptions = {}) {
        this.id = id;
        this.parentSceneState = parentSceneState;
        this.sceneState = thisSceneState;
        this.displayMode = options.displayMode || SceneEmbedDisplayMode.Embed;
        this.depth = options.depth !== undefined ? options.depth : 0;
        this.height = options.height || thisSceneState.scene.height;
        this.width = options.width || thisSceneState.scene.width;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    private getSceneEmbedCanvasKey(): string {
        return `${this.parentSceneState.scene.name}_${this.sceneState.scene.name}_${this.id}`;
    }

    containsPosition(x: number, y: number): boolean {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }

    destroy(): void {
        this._isDestroyed = true;
    }

    draw(mainCanvas: GameCanvas, targetCanvas: GameCanvas, controller: Controller): void {
        const embedKey = this.getSceneEmbedCanvasKey();
        const embeddedSceneCanvas = mainCanvas.subCanvas(embedKey, { width: this.width, height: this.height });
        this.sceneState.draw(embeddedSceneCanvas, controller);
        targetCanvas.drawCanvas(embeddedSceneCanvas, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
    }
}