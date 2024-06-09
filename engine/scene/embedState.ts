import { ObjMap, RuntimeID, SceneEmbedDisplayMode } from './../core';
import { GameResources } from './../resources';
import { Scene } from './../scene';
import { SceneEmbed, SceneEmbedOptions } from './embed';

export class SceneEmbedState {
    private readonly _parent: Scene;
    private readonly _resources: GameResources;
    private readonly _sceneEmbedMap: ObjMap<SceneEmbed> = {};

    constructor(resources: GameResources, parent: Scene) {
        this._resources = resources;
        this._parent = parent;
    }

    create(sceneName: string, options: SceneEmbedOptions = {}): SceneEmbed {
        const sceneEmbedId = RuntimeID.next();
        const subScene = <Scene>this._resources.getScene(sceneName);
        const embed = new SceneEmbed(sceneEmbedId, this._parent, subScene, options);

        this._sceneEmbedMap[`${sceneName}_${sceneEmbedId}`] = embed;

        return embed;
    }

    forEach(callback: (self: SceneEmbed) => void): void {
        for (const embedId in this._sceneEmbedMap) {
            callback(this._sceneEmbedMap[embedId]);
        }
    }

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