import { SpatialGrid } from './../engine/core';

describe('SpatialGrid', () => {
    let grid: SpatialGrid<string>;

    function near(x: number, y: number, width: number, height: number): string[] {
        const items: string[] = [];
        grid.forEachNear(x, y, width, height, item => items.push(item));
        return items.sort();
    }

    beforeEach(() => {
        grid = new SpatialGrid<string>(10);
    });

    it('finds items in the cells an area overlaps', () => {
        grid.update('a', 0, 0, 5, 5);
        grid.update('b', 25, 25, 5, 5);

        expect(near(0, 0, 10, 10)).toEqual(['a']);
        expect(near(0, 0, 30, 30)).toEqual(['a', 'b']);
        expect(near(40, 40, 5, 5)).toEqual([]);
    });

    it('finds an item spanning several cells only once', () => {
        grid.update('wide', 5, 5, 30, 30);

        expect(near(0, 0, 40, 40)).toEqual(['wide']);
    });

    it('treats the far edges of an area as outside it', () => {
        grid.update('a', 0, 0, 10, 10);

        expect(near(10, 0, 5, 5)).toEqual([]);
        expect(near(9, 0, 5, 5)).toEqual(['a']);
    });

    it('moves items between cells when updated', () => {
        grid.update('a', 0, 0, 5, 5);
        grid.update('a', 50, 50, 5, 5);

        expect(near(0, 0, 10, 10)).toEqual([]);
        expect(near(50, 50, 5, 5)).toEqual(['a']);
    });

    it('handles negative positions', () => {
        grid.update('a', -15, -15, 5, 5);

        expect(near(-20, -20, 10, 10)).toEqual(['a']);
        expect(near(0, 0, 10, 10)).toEqual([]);
    });

    it('removes items', () => {
        grid.update('a', 0, 0, 5, 5);
        grid.remove('a');

        expect(near(0, 0, 10, 10)).toEqual([]);
    });
});
