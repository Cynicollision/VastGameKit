import { ObjMap, RuntimeID, SceneEmbedDisplayMode } from './../core';
import { SceneController } from './../controller';
import { SceneEmbed, SceneEmbedOptions } from './embed';
import { SceneState } from './sceneState';

export class SceneEmbedState {
    private readonly controller: SceneController;
    private readonly parent: SceneState;
    private readonly sceneEmbedMap: ObjMap<SceneEmbed> = {};

    constructor(controller: SceneController, parent: SceneState) {
        this.controller = controller;
        this.parent = parent;
    }

    private delete(embedKey: string): void {
        delete this.sceneEmbedMap[embedKey];
    }

    private getSceneEmbedKey(name: string, id: number): string {
        return `${name}_${id}`
    }

    create(sceneName: string, options: SceneEmbedOptions = {}, data: any = {}): SceneEmbed {
        const sceneEmbedId = RuntimeID.next();
        const subSceneState = this.controller.getSceneState(sceneName);
        const embed = new SceneEmbed(sceneEmbedId, this.parent, subSceneState, options);
        const embedKey = this.getSceneEmbedKey(sceneName, sceneEmbedId);
        this.sceneEmbedMap[embedKey] = embed;

        embed.sceneState.startOrResume(this.controller, data);

        return embed;
    }

    forEach(callback: (self: SceneEmbed) => void): void {
        for (const embedId in this.sceneEmbedMap) {
            callback(this.sceneEmbedMap[embedId]);
        }
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

    getByDepthAsc(displayMode?: SceneEmbedDisplayMode): SceneEmbed[] {
        return this.getAll(displayMode).sort((a, b) => b.depth - a.depth);
    }

    getByDepthDesc(displayMode?: SceneEmbedDisplayMode): SceneEmbed[] {
        return this.getAll(displayMode).sort((a, b) => a.depth - b.depth);
    }

    step(controller: SceneController): void {
        for (const a in this.sceneEmbedMap) {
            const embed = this.sceneEmbedMap[a];
            if (embed.isDestroyed) {
                const embedKey = this.getSceneEmbedKey(embed.sceneName, embed.id); 
                this.delete(embedKey);
            }
            embed.sceneState.step(controller);
        };
    }
}