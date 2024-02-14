import { Sprite } from './../sprite';

export interface Boundary {
    atPosition(x: number, y: number): PositionedBoundary;
}

export interface PositionedBoundary {
    collidesWith(other: PositionedBoundary): boolean;
    containsPosition(x: number, y: number): boolean;
}

export class PositionedRectBoundary implements PositionedBoundary {
    private boundary: RectBoundary;
    private x: number;
    private y: number;

    constructor(boundary: RectBoundary, x: number, y: number) {
        this.boundary = boundary;
        this.x = x;
        this.y = y;
    }

    collidesWith(other: PositionedRectBoundary): boolean {
        if (this.x > other.x + other.boundary.width || other.x >= this.x + this.boundary.width) {
            return false;
        }

        if (this.y > other.y + other.boundary.height || other.y >= this.y + this.boundary.height) {
            return false;
        }

        return true;
    }

    containsPosition(x: number, y: number): boolean {
        if (this.x > x || x > this.x + this.boundary.width) {
            return false;
        }

        if (this.y > y || y > this.y + this.boundary.height) {
            return false;
        }

        return true;
    }
}

export class RectBoundary implements Boundary {
    private _height: number;
    get height() { return this._height; }

    private _width: number;
    get width() { return this._width; }

    static fromSprite(sprite: Sprite): RectBoundary {
        return new RectBoundary(sprite.height, sprite.width);
    }

    constructor(height: number, width: number) {
        if (height <= 0 || width <= 0) {
            throw new Error('Height and width must both be greater than zero.');
        }

        this._height = height;
        this._width = width;
    }

    atPosition(x: number, y: number): PositionedRectBoundary {
        return new PositionedRectBoundary(this, x, y);
    }
}
