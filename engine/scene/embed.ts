import { SceneEmbedDisplayMode } from './../core';
import { Scene } from './../scene';

export type SceneEmbedOptions = {
    displayMode?: SceneEmbedDisplayMode;
    x?: number;
    y?: number;
}

export class SceneEmbed {
    readonly id: number;
    readonly displayMode: SceneEmbedDisplayMode = SceneEmbedDisplayMode.Embed;
    readonly parent: Scene;
    readonly scene: Scene;
    readonly x: number = 0;
    readonly y: number = 0;

    constructor(id: number, parent: Scene, subScene: Scene, options: SceneEmbedOptions = {}) {
        this.id = id;
        this.parent = parent;
        this.scene = subScene;
        this.displayMode = options.displayMode || SceneEmbedDisplayMode.Embed;
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    containsPosition(x: number, y: number): boolean {
        return x > this.x && x < this.x + this.scene.width && y > this.y && y < this.y + this.scene.height;
    }

    // TODO add: hide() mechanism
}