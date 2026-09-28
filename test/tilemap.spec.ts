import { GameError } from './../engine/core';
import { GameCanvasHtml2D } from './../engine/device/canvas';
import { Background } from './../engine/resources/background';
import { TileMap } from './../engine/resources/tilemap';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

// an 8x4 tileset image of two 4x4 tiles: red, then blue.
function createTilesetImage(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 4;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#f00';
    context.fillRect(0, 0, 4, 4);
    context.fillStyle = '#00f';
    context.fillRect(4, 0, 4, 4);
    return canvas.toDataURL();
}

function mapXml(content: string, attributes: string = ''): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" orientation="orthogonal" renderorder="right-down" width="3" height="2" tilewidth="4" tileheight="4" infinite="0" ${attributes}>
${content}
</map>`;
}

describe('TileMap', () => {
    const tilesetImage = createTilesetImage();
    const embeddedTileset = `<tileset firstgid="1" name="colors" tilewidth="4" tileheight="4" tilecount="2" columns="2"><image source="${tilesetImage}" width="8" height="4"/></tileset>`;

    it('reads map dimensions and CSV tile layers', async () => {
        const map = TileMap.new('test', { source: 'test.tmx' });
        await map.loadFromText(mapXml(`${embeddedTileset}
            <layer id="1" name="Ground" width="3" height="2" opacity="0.5"><data encoding="csv">1,2,0,
0,1,2</data></layer>
            <layer id="2" name="Hidden" width="3" height="2" visible="0"><data encoding="csv">0,0,0,0,0,0</data></layer>`));

        expect(map.loaded).toBeTrue();
        expect([map.width, map.height, map.tileWidth, map.tileHeight]).toEqual([3, 2, 4, 4]);
        expect([map.pixelWidth, map.pixelHeight]).toEqual([12, 8]);
        expect(map.getLayer('Ground').tiles).toEqual([1, 2, 0, 0, 1, 2]);
        expect(map.getLayer('Ground').opacity).toBe(0.5);
        expect(map.getLayer('Hidden').visible).toBeFalse();
    });

    it('reads base64 tile layers and ignores flip flags', async () => {
        // gids 1 and 2 (horizontally flipped), as little-endian 32 bit integers.
        const bytes = [1, 0, 0, 0, 2, 0, 0, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const data = btoa(String.fromCharCode(...bytes));
        const map = TileMap.new('test', { source: 'test.tmx' });

        await map.loadFromText(mapXml(`${embeddedTileset}<layer id="1" name="Ground" width="3" height="2"><data encoding="base64">${data}</data></layer>`));

        expect(map.getLayer('Ground').tiles).toEqual([1, 2, 0, 0, 0, 0]);
    });

    it('rejects compressed tile layers with a helpful error', async () => {
        const map = TileMap.new('test', { source: 'test.tmx' });

        await expectAsync(map.loadFromText(mapXml(`${embeddedTileset}<layer id="1" name="Ground" width="3" height="2"><data encoding="base64" compression="zlib">eJw=</data></layer>`)))
            .toBeRejectedWithError(GameError, /Tile Layer Format to CSV/);
    });

    it('loads external tilesets relative to the map', async () => {
        const requested: string[] = [];
        const fetchText = (url: string): Promise<string> => {
            requested.push(url);
            return Promise.resolve(`<tileset name="colors" tilewidth="4" tileheight="4" tilecount="2" columns="2"><image source="${tilesetImage}" width="8" height="4"/></tileset>`);
        };
        const map = TileMap.new('test', { source: 'test.tmx' });

        await map.loadFromText(mapXml('<tileset firstgid="5" source="colors.tsx"/>'), 'http://example.test/maps/test.tmx', fetchText);

        expect(requested).toEqual(['http://example.test/maps/colors.tsx']);
        expect(map.tilesets[0].firstGid).toBe(5);
        expect(map.tilesets[0].image.width).toBe(8);
    });

    it('finds the image source of tiles across tilesets, with margins and spacing', async () => {
        const map = TileMap.new('test', { source: 'test.tmx' });
        await map.loadFromText(mapXml(`${embeddedTileset}
            <tileset firstgid="3" name="spaced" tilewidth="4" tileheight="4" tilecount="4" columns="2" margin="1" spacing="2"><image source="${tilesetImage}" width="11" height="11"/></tileset>`));

        expect(map.getTile(0)).toBeUndefined();
        expect(map.getTile(2)).toEqual(jasmine.objectContaining({ sx: 4, sy: 0, width: 4, height: 4 }));
        expect(map.getTile(3)).toEqual(jasmine.objectContaining({ sx: 1, sy: 1 }));
        expect(map.getTile(6)).toEqual(jasmine.objectContaining({ sx: 7, sy: 7 }));
    });

    it('reads object layers with classes and typed properties', async () => {
        const map = TileMap.new('test', { source: 'test.tmx' });
        await map.loadFromText(mapXml(`${embeddedTileset}
            <objectgroup id="3" name="Actors">
                <object id="1" name="start" class="actPlayer" x="8" y="4" width="4" height="4">
                    <properties>
                        <property name="lives" type="int" value="3"/>
                        <property name="hero" type="bool" value="true"/>
                        <property name="title" value="Hero"/>
                    </properties>
                </object>
                <object id="2" type="actCoin" gid="1" x="4" y="8" width="4" height="4"/>
            </objectgroup>`));

        const [player, coin] = map.getObjectLayer('Actors').objects;
        expect(player).toEqual({ id: 1, name: 'start', type: 'actPlayer', x: 8, y: 4, width: 4, height: 4, properties: { lives: 3, hero: true, title: 'Hero' } });
        // tile objects are positioned by their bottom-left corner in Tiled.
        expect([coin.type, coin.x, coin.y]).toEqual(['actCoin', 4, 4]);
    });

    it('throws when getting a layer that does not exist', async () => {
        const map = TileMap.new('test', { source: 'test.tmx' });
        await map.loadFromText(mapXml(embeddedTileset));

        expect(() => map.getLayer('Missing')).toThrowError(GameError);
        expect(() => map.getObjectLayer('Missing')).toThrowError(GameError);
    });
});

describe('TileMap in a Scene', () => {
    let testGame: Game;
    let map: TileMap;

    beforeEach(async () => {
        testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actWall').setRectBoundary(4, 4);
        testGame.construction.actors.add('actCoin');

        map = testGame.construction.tileMaps.add('mapTest', { source: 'test.tmx' });
        await map.loadFromText(mapXml(`<tileset firstgid="1" name="colors" tilewidth="4" tileheight="4" tilecount="2" columns="2"><image source="${createTilesetImage()}" width="8" height="4"/></tileset>
            <layer id="1" name="Ground" width="3" height="2"><data encoding="csv">1,2,0,0,0,2</data></layer>
            <objectgroup id="2" name="Actors">
                <object id="1" class="actCoin" x="4" y="0"><properties><property name="value" type="int" value="5"/></properties></object>
                <object id="2" class="spawnPoint" x="8" y="0"/>
            </objectgroup>`));
    });

    it('draws its tile layers onto a Background', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 12, height: 8 });
        const background = Background.createDefaultBackground(12, 8);

        background.setFromTileMap(map);
        background.draw(canvas);

        const pixel = (x: number, y: number) => Array.from(canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
        expect(pixel(1, 1)).toEqual([255, 0, 0, 255]);
        expect(pixel(5, 1)).toEqual([0, 0, 255, 255]);
        expect(pixel(9, 1)).toEqual([0, 0, 0, 0]);
        expect(pixel(9, 5)).toEqual([0, 0, 255, 255]);
    });

    it('creates Instances for the tiles of a tile layer', () => {
        const walls = testGame.controller.sceneState.instances.createFromTileLayer(map, 'Ground', 'actWall');

        expect(walls.map(wall => [wall.x, wall.y])).toEqual([[0, 0], [4, 0], [8, 4]]);
    });

    it('creates Instances for tiles chosen by global id', () => {
        const walls = testGame.controller.sceneState.instances.createFromTileLayer(map, 'Ground', gid => gid === 2 ? 'actWall' : undefined);

        expect(walls.map(wall => [wall.x, wall.y])).toEqual([[4, 0], [8, 4]]);
    });

    it('creates Instances for objects by class, copying their properties', () => {
        const coins = testGame.controller.sceneState.instances.createFromTileMapObjects(map, 'Actors', { actCoin: 'actCoin' });

        expect(coins.length).toBe(1);
        expect([coins[0].actor.name, coins[0].x, coins[0].y]).toEqual(['actCoin', 4, 0]);
        expect(coins[0].state.value).toBe(5);
    });

    it('requires object classes to name Actors unless an Actor key is given', () => {
        expect(() => testGame.controller.sceneState.instances.createFromTileMapObjects(map, 'Actors')).toThrowError(GameError, /spawnPoint/);
    });
});
