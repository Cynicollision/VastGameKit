// TODO move file? to 'core' ?
export type TileMapKey = {
    [key: string]: string;
};

export type TileMapLayer = {
    frames: number[][];
};

export type TileMap = {
    frameLayers: TileMapLayer[];
    key?: TileMapKey;
};