import { MathUtil } from "./math";

export class Geometry {

    static circleContainsPosition(x1: number, y1: number, r: number, x2: number, y2: number): boolean {
        const d2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        return d2 < r * r;
    }

    static circleIntersectsCircle(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        return Math.hypot(x1 - x2, y1 - y2) <= r1 + r2;
    }

    static getLengthDirectionX(length: number, direction: number): number {
        return length * Math.cos(direction * (Math.PI / 180));
    }

    static getLengthDirectionY(length: number, direction: number) {
        return length * Math.sin(direction * (Math.PI / 180));
    }

    static rectangleContainsPosition(x1: number, y1: number, w: number, h: number, x2: number, y2: number): boolean {
        if (x1 > x2 || x2 > x1 + w) {
            return false;
        }

        if (y1 > y2 || y2 > y1 + h) {
            return false;
        }

        return true;
    }

    static rectangleIntersectsCircle(x1: number, y1: number, w: number, h: number, x2: number, y2: number, r: number): boolean {
        const dX = x2 - MathUtil.clamp(x2, x1, x1 + w);
        const dY = y2 - MathUtil.clamp(y2, y1, y1 + h);

        return (dX * dX) + (dY * dY) < (r * r);
    }

    static rectangleIntersectsRectangle(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
        if (x1 > x2 + w2 || x2 >= x1 + w1) {
            return false;
        }

        if (y1 > y2 + h2 || y2 >= y1 + h1) {
            return false;
        }

        return true;
    }
}