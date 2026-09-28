import { GameError, ObjMap } from './../core';
import { Sound, SoundOptions } from './../resources/sound';
import { Sprite, SpriteOptions } from './../resources/sprite';
import { TileMap, TileMapOptions } from './../resources/tilemap';
import { ActorDefinition, ActorOptions } from './actor';
import { Scene, GameScene, SceneOptions } from './scene';

function requireOptions<U>(typeName: string, name: string, options?: U): U {
    if (!options) {
        throw new GameError(`${typeName} ${name} must be defined with options.`);
    }

    return options;
}

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
    readonly tileMaps: GameConstructionRegistry<TileMap, TileMapOptions>;

    constructor() {
        this.actors = new GameConstructionRegistry<ActorDefinition, ActorOptions>('Actor', (name, options) => ActorDefinition.new(name, options));
        this.scenes = new GameConstructionRegistry<Scene, SceneOptions>('Scene', (name, options) => GameScene.new(name, options));
        this.sounds = new GameConstructionRegistry<Sound, SoundOptions>('Sound', (name, options) => Sound.new(name, requireOptions('Sound', name, options)));
        this.sprites = new GameConstructionRegistry<Sprite, SpriteOptions>('Sprite', (name, options) => Sprite.new(name, requireOptions('Sprite', name, options)));
        this.tileMaps = new GameConstructionRegistry<TileMap, TileMapOptions>('TileMap', (name, options) => TileMap.new(name, requireOptions('TileMap', name, options)));
    }

    load(): Promise <void>{
        const promises: Promise<void | string>[] = [];

        this.sounds.resources.forEach(sound => promises.push(sound.loadAudio()));
        this.sprites.resources.forEach(sprite => promises.push(sprite.loadImage()));
        this.tileMaps.resources.forEach(map => promises.push(map.load()));

        return Promise.all(promises).then(() => Promise.resolve());
    }
}