import { ObjMap, RuntimeID, SceneEmbedDisplayMode } from './../core';
import { SceneEmbed, SceneEmbedOptions } from './embed';
import { SceneState } from './sceneState';

export class SceneEmbedState {
    private readonly _parent: SceneState;
    private readonly _sceneEmbedMap: ObjMap<SceneEmbed> = {};

    constructor(parent: SceneState) {
        this._parent = parent;
    }

    private getSceneEmbedKey(name: string, id: number): string {
        return `${name}_${id}`
    }

    create(sceneName: string, options: SceneEmbedOptions = {}): SceneEmbed {
        const sceneEmbedId = RuntimeID.next();
        const subSceneState = this._parent.controller.getSceneState(sceneName);
        const embed = new SceneEmbed(sceneEmbedId, this._parent, subSceneState, options);
        const embedKey = this.getSceneEmbedKey(sceneName, sceneEmbedId);
        this._sceneEmbedMap[embedKey] = embed;

        return embed;
    }

    forEach(callback: (self: SceneEmbed) => void): void {
        for (const embedId in this._sceneEmbedMap) {
            callback(this._sceneEmbedMap[embedId]);
        }
    }

    // TODO: remove param, make separate e.g. 'getByDisplayMode'
    getAll(displayMode?: SceneEmbedDisplayMode): SceneEmbed[] {
        const embeds: SceneEmbed[] = [];

        for (const a in this._sceneEmbedMap) {
            const embed = this._sceneEmbedMap[a];
            if (!displayMode || displayMode === embed.displayMode) {
                embeds.push(this._sceneEmbedMap[a]);
            }
        }

        return embeds;
    }
}