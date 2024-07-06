import { Sprite } from './sprite';

export type TileMapLayer = {
    frames: number[][];
};

export type TileMap = {
    frameLayers: TileMapLayer[];
    sprite: Sprite;
};