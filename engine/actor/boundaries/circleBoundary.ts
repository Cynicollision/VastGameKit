import { Boundary, PositionedBoundary } from './../boundary';
import { Geometry } from '../../core';
import { PositionedRectBoundary } from './rectangleBoundary';
import { Sprite } from './../../sprite';


export class CircleBoundary implements Boundary {
    private _originX: number;
    private _originY: number;

    private _radius: number;
    get radius() { return this._radius; }

    get height() { return this._radius * 2; }
    get width() { return this._radius * 2; }

    static fromSprite(sprite: Sprite, originX: number = 0, originY: number = 0): CircleBoundary {
        return new CircleBoundary(sprite.width / 2, originX, originY);
    }

    constructor(radius: number, originX: number = 0, originY: number = 0) {
        this._originX = originX;
        this._originY = originY;
        this._radius = radius;
    }

    atPosition(x: number, y: number): PositionedCircleBoundary {
        return new PositionedCircleBoundary(this, x + this._originX + this.radius, y + this._originY + this.radius);
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
    }
    
    containsPosition(x: number, y: number): boolean {
        return Geometry.circleContainsPosition(this.x, this.y, this.boundary.radius, x, y);
    }
}
