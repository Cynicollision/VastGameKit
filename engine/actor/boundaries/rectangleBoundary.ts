import { Geometry } from './../../core/geometry';
import { Sprite } from './../../sprite/sprite';
import { Boundary, PositionedBoundary } from './../boundary';
import { PositionedCircleBoundary } from './circleBoundary';

export class RectBoundary implements Boundary {
    private _originX: number;
    private _originY: number;

    private _height: number;
    get height() { return this._height; }

    private _width: number;
    get width() { return this._width; }

    static fromSprite(sprite: Sprite, originX: number = 0, originY: number = 0): RectBoundary {
        return new RectBoundary(sprite.height, sprite.width, originX, originY);
    }

    constructor(height: number, width: number, originX: number = 0, originY: number = 0) {
        if (height <= 0 || width <= 0) {
            throw new Error('Height and width must both be greater than zero.');
        }

        this._height = height;
        this._originX = originX;
        this._originY = originY;
        this._width = width;
    }

    atPosition(x: number, y: number): PositionedRectBoundary {
        return new PositionedRectBoundary(this, x + this._originX, y + this._originY);
    }
}

export class PositionedRectBoundary implements PositionedBoundary {
    readonly boundary: RectBoundary;
    readonly x: number;
    readonly y: number;

    constructor(boundary: RectBoundary, x: number, y: number) {
        this.boundary = boundary;
        this.x = x;
        this.y = y;
    }

    collidesWith(other: PositionedBoundary): boolean {
        if (other instanceof PositionedRectBoundary) {
            return Geometry.rectangleIntersectsRectangle(this.x, this.y, this.boundary.width, this.boundary.height, other.x, other.y, other.boundary.width, other.boundary.height);
        }
        else if (other instanceof PositionedCircleBoundary) {
            return Geometry.rectangleIntersectsCircle(this.x, this.y, this.boundary.width, this.boundary.height, other.x, other.y, other.boundary.radius);
        }
        
        return false;
    }

    containsPosition(x: number, y: number): boolean {
        return Geometry.rectangleContainsPosition(this.x, this.y, this.boundary.width, this.boundary.height, x, y);
    }
}