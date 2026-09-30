import { Boundary, PositionedBoundary } from './../boundary';
import { Geometry } from './../geometry';
import { Sprite } from './../../resources/sprite';
import { CircleBoundary, PositionedCircleBoundary } from './circleBoundary';

export class RectBoundary implements Boundary {
    readonly originX: number;
    readonly originY: number;

    private _height: number;
    get height() { return this._height; }

    private _width: number;
    get width() { return this._width; }

    static fromSprite(sprite: Sprite, originX: number = 0, originY: number = 0): RectBoundary {
        return new RectBoundary(sprite.width, sprite.height, originX, originY);
    }

    constructor(width: number, height: number, originX: number = 0, originY: number = 0) {
        if (height <= 0 || width <= 0) {
            throw new Error('Height and width must both be greater than zero.');
        }

        this._height = height;
        this.originX = originX;
        this.originY = originY;
        this._width = width;
    }

    atPosition(x: number, y: number): PositionedRectBoundary {
        return new PositionedRectBoundary(this, x + this.originX, y + this.originY);
    }

    collidesAt(x: number, y: number, other: Boundary, otherX: number, otherY: number): boolean {
        const left = x + this.originX;
        const top = y + this.originY;

        if (other instanceof RectBoundary) {
            return Geometry.rectangleIntersectsRectangle(left, top, this._width, this._height, otherX + other.originX, otherY + other.originY, other.width, other.height);
        }
        else if (other instanceof CircleBoundary) {
            return Geometry.rectangleIntersectsCircle(left, top, this._width, this._height, otherX + other.originX + other.radius, otherY + other.originY + other.radius, other.radius);
        }

        return false;
    }

    containsPositionAt(x: number, y: number, positionX: number, positionY: number): boolean {
        return Geometry.rectangleContainsPosition(x + this.originX, y + this.originY, this._width, this._height, positionX, positionY);
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
