import { Geometry } from '../util';
import { Sprite } from './../sprite';

export interface Boundary {
    atPosition(x: number, y: number): PositionedBoundary;
    height: number;
    width: number;
}

export interface PositionedBoundary {
    collidesWith(other: PositionedBoundary): boolean;
    containsPosition(x: number, y: number): boolean;
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

export class CircleBoundary implements Boundary {
    private _radius: number;
    get radius() { return this._radius; }

    get height() { return this._radius * 2; }
    get width() { return this._radius * 2; }

    static fromSprite(sprite: Sprite): CircleBoundary {
        return new CircleBoundary(sprite.width / 2);
    }

    constructor(radius: number) {
        this._radius = radius;
    }

    atPosition(x: number, y: number): PositionedCircleBoundary {
        return new PositionedCircleBoundary(this, x + this.radius, y + this.radius);
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
