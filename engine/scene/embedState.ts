import { ObjMap, PointerInputEvent, RuntimeID } from './../core';
import { GameCanvas } from './../device/canvas';
import { SceneController } from './../controller';
import { SubScene, SubSceneOptions } from './subScene';

// TODO rename -> SubSceneState ? SceneSubSceneState
export class SceneEmbedState {
    private readonly controller: SceneController;
    private readonly subSceneMap: ObjMap<SubScene> = {};

    constructor(controller: SceneController) {
        this.controller = controller;
    }

    private delete(subSceneKey: string): void {
        delete this.subSceneMap[subSceneKey];
    }

    private getByDepthAsc(): SubScene[] {
        return this.toList().sort((a, b) => b.depth - a.depth);
    }

    private getByDepthDesc(): SubScene[] {
        return this.toList().sort((a, b) => a.depth - b.depth);
    }

    private getSubSceneKey(name: string, id: number): string {
        return `${name}_${id}`
    }

    create(sceneName: string, options: SubSceneOptions = {}, data: any = {}): SubScene {
        const subSceneId = RuntimeID.next();
        const subSceneState = this.controller.getSceneState(sceneName);
        const subScene = new SubScene(subSceneId, subSceneState, options);
        const subSceneKey = this.getSubSceneKey(sceneName, subSceneId);
        this.subSceneMap[subSceneKey] = subScene;

        subScene.sceneState.startOrResume(this.controller, data);

        return subScene;
    }

    draw(mainCanvas: GameCanvas, targetCanvas: GameCanvas, controller: SceneController): void {
        this.getByDepthAsc().forEach(subScene => subScene.draw(mainCanvas, targetCanvas, controller));
    }

    forEach(callback: (self: SubScene) => void): void {
        for (const subSceneId in this.subSceneMap) {
            callback(this.subSceneMap[subSceneId]);
        }
    }

    handlePointerEvent(event: PointerInputEvent, controller: SceneController): void {
        this.getByDepthDesc().forEach(embed => {
            if (embed.containsPosition(event.x, event.y)) {
                const relativeEvent = event.translate(-embed.x, -embed.y);
                embed.sceneState.handlePointerEvent(relativeEvent, controller);
                event.cancel();
            }
        });
    }

    // TODO make private, tests that use this should test differently.
    toList(): SubScene[] {
        const subScenes: SubScene[] = [];

        for (const a in this.subSceneMap) {
            subScenes.push(this.subSceneMap[a]);
        }

        return subScenes;
    }

    step(controller: SceneController): void {
        for (const a in this.subSceneMap) {
            const subScene = this.subSceneMap[a];
            if (subScene.isDestroyed) {
                const subSceneKey = this.getSubSceneKey(subScene.sceneName, subScene.id); 
                this.delete(subSceneKey);
            }
            else {
                subScene.sceneState.step(controller);
            }
        }
    }
}