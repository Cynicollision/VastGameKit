import { ObjMap, RuntimeID, SceneEmbedDisplayMode } from './core';
import { GameResources } from './gameResources';
import { Scene } from './scene';
import { SceneEmbed, SceneEmbedOptions } from './sceneEmbed';

export class SceneEmbedState {
    private readonly resources: GameResources;
    private readonly parent: Scene;
    private readonly sceneEmbedMap: ObjMap<SceneEmbed> = {};

    constructor(resources: GameResources, parent: Scene) {
        this.resources = resources;
        this.parent = parent;
    }

    private getSceneEmbedCanvasKey(embed: SceneEmbed): string {
        return `${this.parent.name}_${embed.scene.name}_${embed.id}`;
    }

    create(sceneName: string, options: SceneEmbedOptions = {}): SceneEmbed {
        const sceneEmbedId = RuntimeID.next();
        const subScene = <Scene>this.resources.getScene(sceneName);
        const embed = new SceneEmbed(sceneEmbedId, this.parent, subScene, options);

        this.sceneEmbedMap[`${sceneName}_${sceneEmbedId}`] = embed;

        return embed;
    }

    getAll(displayMode?: SceneEmbedDisplayMode): SceneEmbed[] {
        const embeds: SceneEmbed[] = [];

        for (const a in this.sceneEmbedMap) {
            const embed = this.sceneEmbedMap[a];
            if (!displayMode || displayMode === embed.displayMode) {
                embeds.push(this.sceneEmbedMap[a]);
            }
        }

        return embeds;
    }
}