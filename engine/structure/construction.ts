import { GameError, ObjMap } from './../core';
import { Sound, SoundOptions } from './../resources/sound';
import { Sprite, SpriteOptions } from './../resources/sprite';
import { ActorDefinition, Actor, ActorOptions } from './actor';
import { Scene, GameScene, SceneOptions } from './scene';

export class GameConstruction {
    private readonly actorMap: ObjMap<ActorDefinition> = {};
    private readonly sceneMap: ObjMap<GameScene> = {};
    private readonly soundMap: ObjMap<Sound> = {};
    private readonly spriteMap: ObjMap<Sprite> = {};

    defineActor(actorName: string, options: ActorOptions = {}): Actor {
        if (this.actorMap[actorName]) {
            throw new GameError(`Actor defined with existing Actor name: ${actorName}.`);
        }
        
        const actor = ActorDefinition.new(actorName, options);
        this.actorMap[actorName] = <ActorDefinition>actor;

        return actor;
    }

    defineScene(sceneName: string, options: SceneOptions = {}): Scene {
        if (this.sceneMap[sceneName]) {
            throw new GameError(`Scene defined with existing Scene name: ${sceneName}.`);
        }

        const scene = <GameScene>GameScene.new(sceneName, options);
        this.sceneMap[sceneName] = scene;

        return scene;
    }

    defineSound(audioName: string, source: string, options?: SoundOptions): Sound {
        if (this.soundMap[audioName]) {
            throw new GameError(`Sound defined with existing Audio name: ${audioName}.`);
        }

        const audio = Sound.fromSource(audioName, source, options);
        this.soundMap[audioName] = audio;

        return audio;
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

    getScene(sceneName: string): Scene {
        if (!this.sceneMap[sceneName]) {
            throw new GameError(`Scene retrieved by name that does not exist: ${sceneName}.`);
        }

        return this.sceneMap[sceneName];
    }

    getSound(soundName: string): Sound {
        if (!this.soundMap[soundName]) {
            throw new GameError(`Sound retrieved by name that does not exist: ${soundName}.`);
        }

        return this.soundMap[soundName];
    }

    getSprite(spriteName: string): Sprite {
        if (!this.spriteMap[spriteName]) {
            throw new GameError(`Sprite retrieved by name that does not exist: ${spriteName}.`);
        }

        return this.spriteMap[spriteName];
    }

    load(): Promise <void>{
        const promises: Promise<void | string>[] = [];
        //const audioContext = new window.AudioContext();

        for (const soundName in this.soundMap) {
            const sound = this.soundMap[soundName];
            promises.push(sound.loadAudio());
        }
        // TODO: error handling

        for (const spriteName in this.spriteMap) {
            const sprite = this.spriteMap[spriteName];
            promises.push(sprite.loadImage());
        }

        return Promise.all(promises).then(() => Promise.resolve());
    }
}