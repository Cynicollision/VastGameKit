import { GameError, ObjMap } from './core';
import { GameAudio, GameAudioOptions } from './device/audio';
import { ActorDefinition, Actor, ActorOptions } from './actor';
import { Scene, GameScene, SceneOptions } from './scene';
import { Sprite, SpriteOptions } from './sprite';

export class GameResources {
    private readonly actorMap: ObjMap<ActorDefinition> = {};
    private readonly audioMap: ObjMap<GameAudio> = {};
    private readonly sceneMap: ObjMap<GameScene> = {};
    private readonly spriteMap: ObjMap<Sprite> = {};

    defineActor(actorName: string, options: ActorOptions = {}): Actor {
        if (this.actorMap[actorName]) {
            throw new GameError(`Actor defined with existing Actor name: ${actorName}.`);
        }
        
        const actor = ActorDefinition.new(actorName, options);
        this.actorMap[actorName] = <ActorDefinition>actor;

        return actor;
    }

    defineAudio(audioName: string, source: string, options?: GameAudioOptions): GameAudio {
        if (this.audioMap[audioName]) {
            throw new GameError(`Audio defined with existing Audio name: ${audioName}.`);
        }

        const audio = GameAudio.fromSource(audioName, source, options);
        this.audioMap[audioName] = audio;

        return audio;
    }

    defineScene(sceneName: string, options: SceneOptions = {}): Scene {
        if (this.sceneMap[sceneName]) {
            throw new GameError(`Scene defined with existing Scene name: ${sceneName}.`);
        }

        const scene = <GameScene>GameScene.new(sceneName, this, options);
        this.sceneMap[sceneName] = scene;

        return scene;
    }

    defineSprite(spriteName: string, imageSource: string, options: SpriteOptions = {}): Sprite {
        if (this.spriteMap[spriteName]) {
            throw new GameError(`Sprite defined with existing Sprite name: ${spriteName}.`);
        }

        const newSprite = Sprite.fromSource(spriteName, imageSource, options);
        this.spriteMap[spriteName] = newSprite;

        return newSprite;
    }

    getActor(actorName: string): Actor {
        if (!this.actorMap[actorName]) {
            throw new GameError(`Actor retrieved by name that does not exist: ${actorName}.`);
        }

        return this.actorMap[actorName];
    }

    getAudio(audioName: string): GameAudio {
        if (!this.audioMap[audioName]) {
            throw new GameError(`Audio retrieved by name that does not exist: ${audioName}.`);
        }

        return this.audioMap[audioName];
    }

    getScene(sceneName: string): Scene {
        if (!this.sceneMap[sceneName]) {
            throw new GameError(`Scene retrieved by name that does not exist: ${sceneName}.`);
        }

        return this.sceneMap[sceneName];
    }

    getSprite(spriteName: string): Sprite {
        if (!this.spriteMap[spriteName]) {
            throw new GameError(`Sprite retrieved by name that does not exist: ${spriteName}.`);
        }

        return this.spriteMap[spriteName];
    }

    load(): Promise <void>{
        const promises: Promise<void | string>[] = [];

        // TODO: add audio loading.
        // TODO: error handling

        for (const s in this.spriteMap) {
            const sprite = this.spriteMap[s];
            promises.push(sprite.load());
        }

        return Promise.all(promises)
            .then(() => {
                for (const a in this.actorMap) {
                    const actor = this.actorMap[a];
                    actor.load();
                }

                // TODO add callback for game setup code, to be called last.
                //  see Actor and Scene load.

                return Promise.resolve();
            });
    }
}