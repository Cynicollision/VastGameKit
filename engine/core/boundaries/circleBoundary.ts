import { Boundary, PositionedBoundary } from './../boundary';
import { Geometry } from './../geometry';
import { Sprite } from './../../resources/sprite';
import { PositionedRectBoundary, RectBoundary } from './rectangleBoundary';

export class CircleBoundary implements Boundary {
    readonly originX: number;
    readonly originY: number;

    private _radius: number;
    get radius() { return this._radius; }

    get height() { return this._radius * 2; }
    get width() { return this._radius * 2; }

    static fromSprite(sprite: Sprite, originX: number = 0, originY: number = 0): CircleBoundary {
        return new CircleBoundary(sprite.width / 2, originX, originY);
    }

    constructor(radius: number, originX: number = 0, originY: number = 0) {
        this.originX = originX;
        this.originY = originY;
        this._radius = radius;
    }

    atPosition(x: number, y: number): PositionedCircleBoundary {
        return new PositionedCircleBoundary(this, x + this.originX + this.radius, y + this.originY + this.radius);
    }

    collidesAt(x: number, y: number, other: Boundary, otherX: number, otherY: number): boolean {
        const centerX = x + this.originX + this._radius;
        const centerY = y + this.originY + this._radius;

        if (other instanceof CircleBoundary) {
            return Geometry.circleIntersectsCircle(centerX, centerY, this._radius, otherX + other.originX + other.radius, otherY + other.originY + other.radius, other.radius);
        }
        else if (other instanceof RectBoundary) {
            return Geometry.rectangleIntersectsCircle(otherX + other.originX, otherY + other.originY, other.width, other.height, centerX, centerY, this._radius);
        }

        return false;
    }

    containsPositionAt(x: number, y: number, positionX: number, positionY: number): boolean {
        return Geometry.circleContainsPosition(x + this.originX + this._radius, y + this.originY + this._radius, this._radius, positionX, positionY);
    }
}

export class PositionedCircleBoundary implements PositionedBoundary {
    readonly boundary: CircleBoundary;
    readonly x: number;
    readonly y: number;

    constructor(boundary: CircleBoundary, x: number, y: number) {
        this.boundary = boundary;
        this.x = x;
        this.y = y;
    }

    collidesWith(other: PositionedBoundary): boolean {
        if (other instanceof PositionedCircleBoundary) {
            return Geometry.circleIntersectsCircle(this.x, this.y, this.boundary.radius, other.x, other.y, other.boundary.radius);
        }
        else if (other instanceof PositionedRectBoundary) {
            return Geometry.rectangleIntersectsCircle(other.x, other.y, other.boundary.width, other.boundary.height, this.x, this.y, this.boundary.radius);
        }

        return false;
    }

    containsPosition(x: number, y: number): boolean {
        return Geometry.circleContainsPosition(this.x, this.y, this.boundary.radius, x, y);
    }
}
