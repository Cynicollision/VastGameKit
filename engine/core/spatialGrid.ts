type GridCellRange = {
    minColumn: number;
    minRow: number;
    maxColumn: number;
    maxRow: number;
};

// Buckets items into square cells by their bounding boxes, so area queries only visit nearby items.
export class SpatialGrid<T> {
    static readonly DefaultCellSize = 64;

    private readonly cellSize: number;
    private readonly cells = new Map<number, Set<T>>();
    private readonly ranges = new Map<T, GridCellRange>();
    private readonly visited = new Set<T>();

    constructor(cellSize: number = SpatialGrid.DefaultCellSize) {
        this.cellSize = cellSize;
    }

    // columns and rows from -32768 to 32767 map to unique keys.
    private static getCellKey(column: number, row: number): number {
        return (column + 32768) * 65536 + (row + 32768);
    }

    private addToCells(item: T, range: GridCellRange): void {
        for (let column = range.minColumn; column <= range.maxColumn; column++) {
            for (let row = range.minRow; row <= range.maxRow; row++) {
                const key = SpatialGrid.getCellKey(column, row);
                let cell = this.cells.get(key);
                if (!cell) {
                    cell = new Set<T>();
                    this.cells.set(key, cell);
                }
                cell.add(item);
            }
        }
    }

    private getRange(x: number, y: number, width: number, height: number): GridCellRange {
        return {
            minColumn: Math.floor(x / this.cellSize),
            minRow: Math.floor(y / this.cellSize),
            // an area's right and bottom edges are exclusive.
            maxColumn: Math.floor((x + Math.max(width, 1) - 1e-9) / this.cellSize),
            maxRow: Math.floor((y + Math.max(height, 1) - 1e-9) / this.cellSize),
        };
    }

    private removeFromCells(item: T, range: GridCellRange): void {
        for (let column = range.minColumn; column <= range.maxColumn; column++) {
            for (let row = range.minRow; row <= range.maxRow; row++) {
                const key = SpatialGrid.getCellKey(column, row);
                const cell = this.cells.get(key);
                if (cell) {
                    cell.delete(item);
                    if (cell.size === 0) {
                        this.cells.delete(key);
                    }
                }
            }
        }
    }

    // Calls the callback once for each item whose cells overlap the area. Items may not actually overlap it.
    // The callback must not update the grid or query it again.
    forEachNear(x: number, y: number, width: number, height: number, callback: (item: T) => void): void {
        const range = this.getRange(x, y, width, height);

        if (range.minColumn === range.maxColumn && range.minRow === range.maxRow) {
            const cell = this.cells.get(SpatialGrid.getCellKey(range.minColumn, range.minRow));
            if (cell) {
                cell.forEach(item => callback(item));
            }
            return;
        }

        // items spanning several cells are only visited once.
        this.visited.clear();

        for (let column = range.minColumn; column <= range.maxColumn; column++) {
            for (let row = range.minRow; row <= range.maxRow; row++) {
                const cell = this.cells.get(SpatialGrid.getCellKey(column, row));
                if (!cell) {
                    continue;
                }

                for (const item of cell) {
                    if (!this.visited.has(item)) {
                        this.visited.add(item);
                        callback(item);
                    }
                }
            }
        }
    }

    remove(item: T): void {
        const range = this.ranges.get(item);
        if (range) {
            this.removeFromCells(item, range);
            this.ranges.delete(item);
        }
    }

    update(item: T, x: number, y: number, width: number, height: number): void {
        const current = this.ranges.get(item);

        // most updates stay within the same cells.
        if (current) {
            const minColumn = Math.floor(x / this.cellSize);
            const minRow = Math.floor(y / this.cellSize);
            const maxColumn = Math.floor((x + Math.max(width, 1) - 1e-9) / this.cellSize);
            const maxRow = Math.floor((y + Math.max(height, 1) - 1e-9) / this.cellSize);
            if (current.minColumn === minColumn && current.minRow === minRow && current.maxColumn === maxColumn && current.maxRow === maxRow) {
                return;
            }
            this.removeFromCells(item, current);
        }

        const range = this.getRange(x, y, width, height);
        this.addToCells(item, range);
        this.ranges.set(item, range);
    }
}
