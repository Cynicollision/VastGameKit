import { GameError, ObjMap } from './../core';

export type TileMapOptions = {
    // URL of a Tiled map (.tmx).
    source: string;
};

export type TileMapLayer = {
    readonly name: string;
    readonly width: number;
    readonly height: number;
    readonly opacity: number;
    readonly visible: boolean;
    readonly offsetX: number;
    readonly offsetY: number;
    // global tile ids by row, then column. 0 is an empty tile.
    readonly tiles: readonly number[];
};

export type TileMapObject = {
    readonly id: number;
    readonly name: string;
    // the object's class (called type before Tiled 1.9).
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly properties: ObjMap<string | number | boolean>;
};

export type TileMapObjectLayer = {
    readonly name: string;
    readonly objects: readonly TileMapObject[];
};

export type TileMapTileset = {
    readonly firstGid: number;
    readonly name: string;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly columns: number;
    readonly margin: number;
    readonly spacing: number;
    readonly tileCount: number;
    readonly image: HTMLImageElement;
};

export type TileMapTile = {
    readonly image: HTMLImageElement;
    readonly sx: number;
    readonly sy: number;
    readonly width: number;
    readonly height: number;
};

type FetchText = (url: string) => Promise<string>;

// the top bits of a global tile id flag flips and rotation, which aren't supported when drawing.
const TileIdMask = 0x0fffffff;

function fetchText(url: string): Promise<string> {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new GameError(`Failed to fetch ${url}: ${response.status} ${response.statusText}.`);
        }
        return response.text();
    });
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = (): void => resolve(image);
        image.onerror = (): void => reject(new GameError(`Failed to load tileset image from source: ${url.substring(0, 100)}.`));
        image.src = url;
    });
}

function numberAttribute(element: Element, name: string, defaultValue: number = 0): number {
    const value = element.getAttribute(name);
    return value !== null ? Number(value) : defaultValue;
}

function parseXml(text: string, source: string): Document {
    const document = new DOMParser().parseFromString(text, 'application/xml');

    if (document.getElementsByTagName('parsererror').length > 0) {
        throw new GameError(`Failed to parse XML from ${source}.`);
    }

    return document;
}

function parseProperties(element: Element): ObjMap<string | number | boolean> {
    const properties: ObjMap<string | number | boolean> = {};
    const propertiesElement = Array.from(element.children).find(child => child.tagName === 'properties');

    if (propertiesElement) {
        for (const property of Array.from(propertiesElement.getElementsByTagName('property'))) {
            const name = property.getAttribute('name') || '';
            const type = property.getAttribute('type') || 'string';
            const value = property.getAttribute('value') !== null ? property.getAttribute('value')! : (property.textContent || '');

            properties[name] = type === 'int' || type === 'float' ? Number(value) : type === 'bool' ? value === 'true' : value;
        }
    }

    return properties;
}

function parseTileData(data: Element, layerName: string): number[] {
    const encoding = data.getAttribute('encoding');
    const compression = data.getAttribute('compression');

    if (encoding === 'csv') {
        return (data.textContent || '').split(',').map(value => Number(value.trim()) & TileIdMask);
    }

    if (encoding === 'base64' && !compression) {
        const bytes = atob((data.textContent || '').trim());
        const tiles: number[] = [];
        for (let i = 0; i + 3 < bytes.length; i += 4) {
            const id = bytes.charCodeAt(i) | (bytes.charCodeAt(i + 1) << 8) | (bytes.charCodeAt(i + 2) << 16) | (bytes.charCodeAt(i + 3) << 24);
            tiles.push(id & TileIdMask);
        }
        return tiles;
    }

    throw new GameError(`Tile layer "${layerName}" uses unsupported ${encoding || 'xml'}${compression ? `/${compression}` : ''} encoding. In Tiled, set the map's Tile Layer Format to CSV.`);
}

// A Tiled map (.tmx) with its tilesets, tile layers, and object layers.
export class TileMap {
    readonly name: string;
    readonly source: string;

    private _loaded = false;
    get loaded() { return this._loaded; }

    private _width = 0;
    // width in tiles.
    get width() { return this._width; }

    private _height = 0;
    // height in tiles.
    get height() { return this._height; }

    private _tileWidth = 0;
    get tileWidth() { return this._tileWidth; }

    private _tileHeight = 0;
    get tileHeight() { return this._tileHeight; }

    get pixelWidth() { return this._width * this._tileWidth; }
    get pixelHeight() { return this._height * this._tileHeight; }

    private _layers: TileMapLayer[] = [];
    get layers(): readonly TileMapLayer[] { return this._layers; }

    private _objectLayers: TileMapObjectLayer[] = [];
    get objectLayers(): readonly TileMapObjectLayer[] { return this._objectLayers; }

    private _tilesets: TileMapTileset[] = [];
    get tilesets(): readonly TileMapTileset[] { return this._tilesets; }

    static new(name: string, options: TileMapOptions): TileMap {
        return new TileMap(name, options);
    }

    private constructor(name: string, options: TileMapOptions) {
        this.name = name;
        this.source = options.source;
    }

    private async parseTileset(element: Element, baseUrl: string, fetch: FetchText): Promise<TileMapTileset> {
        const firstGid = numberAttribute(element, 'firstgid', 1);
        let tilesetElement = element;
        let tilesetUrl = baseUrl;

        // an external tileset (.tsx)
        const source = element.getAttribute('source');
        if (source) {
            tilesetUrl = new URL(source, baseUrl).href;
            tilesetElement = parseXml(await fetch(tilesetUrl), tilesetUrl).documentElement;
        }

        const imageElement = tilesetElement.getElementsByTagName('image')[0];
        if (!imageElement) {
            throw new GameError(`Tileset in ${this.source} has no single image. Image collection tilesets aren't supported.`);
        }

        const tileWidth = numberAttribute(tilesetElement, 'tilewidth');
        const margin = numberAttribute(tilesetElement, 'margin');
        const spacing = numberAttribute(tilesetElement, 'spacing');
        const image = await loadImage(new URL(imageElement.getAttribute('source') || '', tilesetUrl).href);
        const imageWidth = numberAttribute(imageElement, 'width', image.width);

        return {
            firstGid: firstGid,
            name: tilesetElement.getAttribute('name') || '',
            tileWidth: tileWidth,
            tileHeight: numberAttribute(tilesetElement, 'tileheight'),
            columns: numberAttribute(tilesetElement, 'columns', Math.floor((imageWidth - margin * 2 + spacing) / (tileWidth + spacing))),
            margin: margin,
            spacing: spacing,
            tileCount: numberAttribute(tilesetElement, 'tilecount'),
            image: image,
        };
    }

    getLayer(layerName: string): TileMapLayer {
        const layer = this._layers.find(layer => layer.name === layerName);
        if (!layer) {
            throw new GameError(`TileMap ${this.name} has no tile layer named ${layerName}.`);
        }
        return layer;
    }

    getObjectLayer(layerName: string): TileMapObjectLayer {
        const layer = this._objectLayers.find(layer => layer.name === layerName);
        if (!layer) {
            throw new GameError(`TileMap ${this.name} has no object layer named ${layerName}.`);
        }
        return layer;
    }

    // Where to find a global tile id's image, or undefined for an empty or unknown tile.
    getTile(gid: number): TileMapTile | undefined {
        let tileset: TileMapTileset | undefined;
        for (const candidate of this._tilesets) {
            if (candidate.firstGid <= gid && (!tileset || candidate.firstGid > tileset.firstGid)) {
                tileset = candidate;
            }
        }

        if (gid === 0 || !tileset) {
            return undefined;
        }

        const id = gid - tileset.firstGid;
        return {
            image: tileset.image,
            sx: tileset.margin + (id % tileset.columns) * (tileset.tileWidth + tileset.spacing),
            sy: tileset.margin + Math.floor(id / tileset.columns) * (tileset.tileHeight + tileset.spacing),
            width: tileset.tileWidth,
            height: tileset.tileHeight,
        };
    }

    load(): Promise<void> {
        if (this._loaded) {
            return Promise.resolve();
        }

        const url = new URL(this.source, document.baseURI).href;
        return fetchText(url).then(text => this.loadFromText(text, url));
    }

    // Loads the map from .tmx text. External tilesets and images resolve relative to baseUrl.
    async loadFromText(text: string, baseUrl: string = document.baseURI, fetch: FetchText = fetchText): Promise<void> {
        const map = parseXml(text, this.source).documentElement;

        if (map.getAttribute('orientation') !== 'orthogonal') {
            throw new GameError(`TileMap ${this.name} must be orthogonal.`);
        }
        if (map.getAttribute('infinite') === '1') {
            throw new GameError(`TileMap ${this.name} is infinite, which isn't supported. In Tiled, uncheck Infinite in the map's properties.`);
        }

        this._width = numberAttribute(map, 'width');
        this._height = numberAttribute(map, 'height');
        this._tileWidth = numberAttribute(map, 'tilewidth');
        this._tileHeight = numberAttribute(map, 'tileheight');

        const tilesetElements = Array.from(map.children).filter(child => child.tagName === 'tileset');
        this._tilesets = await Promise.all(tilesetElements.map(element => this.parseTileset(element, baseUrl, fetch)));

        // layers inside groups are included, in drawing order.
        this._layers = [];
        this._objectLayers = [];
        for (const element of Array.from(map.querySelectorAll('layer, objectgroup'))) {
            const name = element.getAttribute('name') || '';

            if (element.tagName === 'layer') {
                const data = element.getElementsByTagName('data')[0];
                this._layers.push({
                    name: name,
                    width: numberAttribute(element, 'width', this._width),
                    height: numberAttribute(element, 'height', this._height),
                    opacity: numberAttribute(element, 'opacity', 1),
                    visible: element.getAttribute('visible') !== '0',
                    offsetX: numberAttribute(element, 'offsetx'),
                    offsetY: numberAttribute(element, 'offsety'),
                    tiles: data ? parseTileData(data, name) : [],
                });
            }
            else {
                this._objectLayers.push({
                    name: name,
                    objects: Array.from(element.getElementsByTagName('object')).map(object => {
                        const height = numberAttribute(object, 'height');
                        // tile objects are positioned by their bottom-left corner.
                        const y = numberAttribute(object, 'y') - (object.hasAttribute('gid') ? height : 0);

                        return {
                            id: numberAttribute(object, 'id'),
                            name: object.getAttribute('name') || '',
                            type: object.getAttribute('class') || object.getAttribute('type') || '',
                            x: numberAttribute(object, 'x'),
                            y: y,
                            width: numberAttribute(object, 'width'),
                            height: height,
                            properties: parseProperties(object),
                        };
                    }),
                });
            }
        }

        this._loaded = true;
    }
}
