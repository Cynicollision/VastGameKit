import { GameError, ObjMap } from './../core';
import { Sound, SoundOptions } from './../resources/sound';
import { Sprite, SpriteOptions } from './../resources/sprite';
import { ActorDefinition, ActorOptions } from './actor';
import { Scene, GameScene, SceneOptions } from './scene';

class GameConstructionRegistry<T, U> {
    private readonly resourceMap: ObjMap<T> = {};
    private readonly typeName: string;

    private readonly factory: (name: string, options?: U) => T;

    constructor(typeName: string, factory: (name: string, options?: U) => T) {
        this.typeName = typeName;
        this.factory = factory;
    }

    get resources(): T[] {
        const resources = [];
        for (const name in this.resourceMap) {
            resources.push( this.resourceMap[name]);
        }
        return resources;
    }

    add(name: string, options?: U): T {
        if (this.resourceMap[name]) {
            throw new GameError(`${this.typeName} defined with name that already exists: ${name}.`);
        }
        const resource = this.factory(name, options);
        this.resourceMap[name] = resource;

        return resource;
    }

    get(name: string): T {
        if (!this.resourceMap[name]) {
            throw new GameError(`${this.typeName} retrieved by name that does not exist: ${name}.`);
        }

        return this.resourceMap[name];
    }
}

export class GameConstruction {
    readonly actors: GameConstructionRegistry<ActorDefinition, ActorOptions>;
    readonly scenes: GameConstructionRegistry<Scene, SceneOptions>;
    readonly sounds: GameConstructionRegistry<Sound, SoundOptions>;
    readonly sprites: GameConstructionRegistry<Sprite, SpriteOptions>;

    constructor() {
        this.actors = new GameConstructionRegistry<ActorDefinition, ActorOptions>('Actor', (name, options) => ActorDefinition.new(name, options));
        this.scenes = new GameConstructionRegistry<Scene, SceneOptions>('Scene', (name, options) => GameScene.new(name, options));
        this.sounds = new GameConstructionRegistry<Sound, SoundOptions>('Sound', (name, options) => Sound.new(name, options));
        this.sprites = new GameConstructionRegistry<Sprite, SpriteOptions>('Sprite', (name, options) => Sprite.new(name, options));
    }

    load(): Promise <void>{
        const promises: Promise<void | string>[] = [];

        this.sounds.resources.forEach(sound => promises.push(sound.loadAudio()));
        this.sprites.resources.forEach(sprite => promises.push(sprite.loadImage()));

        return Promise.all(promises).then(() => Promise.resolve());
    }
}