// The tileset for the Tiled maps: 16x16 tiles, by name. Textures are drawn by functions of each pixel's position, which
// return a palette character. Add new tiles at the end, so the maps' tile ids stay the same.
export const TileSize = 16;

// a repeatable pseudo-random number from 0 to 1 for a position.
function noise(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function tile(pixel) {
    const rows = [];
    for (let y = 0; y < TileSize; y++) {
        let row = '';
        for (let x = 0; x < TileSize; x++) {
            row += pixel(x, y);
        }
        rows.push(row);
    }
    return rows;
}

const grass = (x, y) => noise(x, y, 1) < 0.07 || (noise(x, y + 1, 1) < 0.07 && noise(x, y, 2) < 0.5) ? 'E' : 'e';

function flowers(x, y) {
    // small flowers at a few fixed spots.
    for (const [fx, fy, color] of [[3, 4, 'y'], [11, 2, 'w'], [8, 10, 'p'], [13, 13, 'y'], [2, 12, 'w']]) {
        if (x === fx && y === fy) {
            return 'Y';
        }
        if (Math.abs(x - fx) + Math.abs(y - fy) === 1) {
            return color;
        }
    }
    return grass(x, y);
}

const road = (x, y) => noise(x, y, 3) < 0.05 ? 'G' : 'D';
const curb = (y) => y === 0 ? 'w' : y < 3 ? 'g' : 'G';
const sidewalk = (x, y) => x === 0 || y === 0 ? 'T' : noise(x, y, 4) < 0.04 ? 'T' : 't';

function water(x, y, shift) {
    const band = Math.floor(y / 4);
    const offset = (band * 5 + shift) % 8;
    return y % 4 === 1 && (x + offset) % 8 < 3 ? 'c' : y % 4 === 2 && (x + offset) % 8 === 3 ? 'c' : 'b';
}

function planks(x, y) {
    if (y % 4 === 3) {
        return 'N';
    }
    // boards end at staggered joints, with a nail beside each.
    const joint = (Math.floor(y / 4) * 6) % 16;
    return x === joint ? 'N' : (x === joint + 1 || x === joint - 2) && y % 4 === 1 ? 'T' : noise(x, y, 5) < 0.05 ? 'T' : 'n';
}

function bricks(x, y) {
    const course = Math.floor(y / 4);
    return y % 4 === 3 || (x + (course % 2) * 4) % 8 === 0 ? 'R' : noise(x, y, 6) < 0.06 ? 'o' : 'r';
}

function rail(x, y) {
    if (y === 4 || y === 11) {
        return 'w';
    }
    if (y === 5 || y === 12) {
        return 'g';
    }
    if (x % 8 >= 2 && x % 8 <= 4 && y >= 2 && y <= 14) {
        return y === 2 ? 'n' : 'N';
    }
    return noise(x, y, 7) < 0.3 ? 'g' : 'G';
}

// a row of buildings against the sky, with lit windows.
function skyline(x, y, heights) {
    const column = Math.floor(x / 8);
    const top = heights[column];
    if (y < top) {
        return y === 3 && x % 8 === 5 && column === 0 ? 'w' : 'c';
    }
    if (y === top) {
        return 'k';
    }
    return (x % 4 === 1 || x % 4 === 2) && y % 4 === 2 && y > top + 1 ? (noise(x, y, 8) < 0.6 ? 'y' : 'D') : 'G';
}

export const Tiles = {
    grass: tile(grass),
    flowers: tile(flowers),
    // grass with a curb along its bottom or top, beside a road.
    grassCurbBottom: tile((x, y) => y >= 13 ? curb(15 - y) : grass(x, y)),
    grassCurbTop: tile((x, y) => y < 3 ? curb(y) : grass(x, y)),
    sidewalk: tile(sidewalk),
    sidewalkCurbTop: tile((x, y) => y < 3 ? curb(y) : sidewalk(x, y)),
    road: tile(road),
    // road with a dashed white line along its top, between lanes going the same way.
    roadLane: tile((x, y) => y < 2 && x >= 4 && x < 12 ? 'w' : road(x, y)),
    // road with a double yellow line along its top, between lanes going opposite ways.
    roadCenter: tile((x, y) => y === 0 || y === 2 ? 'y' : road(x, y)),
    rail: tile(rail),
    water: tile((x, y) => water(x, y, 0)),
    waterRipple: tile((x, y) => water(x, y, 4)),
    // water in the shade of the wall above it.
    waterShade: tile((x, y) => y < 3 ? 'B' : water(x, y, 2)),
    boardwalk: tile(planks),
    // boardwalk with its edge over the water above it.
    boardwalkEdge: tile((x, y) => y === 0 ? 'k' : y === 1 ? 'N' : planks(x, y)),
    bricks: tile(bricks),
    // the top of the wall, with a stone ledge.
    ledge: tile((x, y) => y < 3 ? (y === 0 ? 'w' : 'g') : y === 3 ? 'G' : bricks(x, y)),
    // a nook in the wall, where a box sits.
    nook: tile((x, y) => y < 3 ? (y === 0 ? 'w' : 'g') : y === 3 ? 'G' : x === 0 || x === 15 ? 'R' : y === 4 ? 'k' : 'D'),
    sky: tile(() => 'c'),
    skylineA: tile((x, y) => skyline(x, y, [6, 2])),
    skylineB: tile((x, y) => skyline(x, y, [4, 8])),
    hedge: tile((x, y) => {
        const bump = Math.abs((x % 8) - 3.5);
        return y < 3 + bump / 2 ? grass(x, y) : y === Math.ceil(3 + bump / 2) ? 'k' : noise(x, y, 9) < 0.2 ? 'e' : 'E';
    }),
};
