import { CircleBoundary } from './../engine/actor/boundary';
import { RectBoundary } from './../engine/actor';

describe('RectBoundary', () => {

    it('detects when overlapping with a RectBoundary', () => {
        const b1 = new RectBoundary(10, 10);
        const b2 = new RectBoundary(12, 12);

        const test = (b1: RectBoundary, b2: RectBoundary) => {
            expect(b1.atPosition(51, 51).collidesWith(b2.atPosition(50, 50))).toBe(true);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(45, 45))).toBe(true);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(45, 55))).toBe(true);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(55, 55))).toBe(true);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(55, 55))).toBe(true);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(50, 65))).toBe(false);
            expect(b1.atPosition(50, 50).collidesWith(b2.atPosition(35, 50))).toBe(false);
        };

        test(b1, b2);
        test(b2, b1);        
    });

    it('detects when overlapping with a CircleBoundary', () => {
        const rect = new RectBoundary(20, 20);
        const circle = new CircleBoundary(6);

        expect(rect.atPosition(0, 0).collidesWith(circle.atPosition(5, 5))).toBeTrue();
        expect(rect.atPosition(0, 0).collidesWith(circle.atPosition(21, 5))).toBeFalse();
        expect(rect.atPosition(0, 0).collidesWith(circle.atPosition(19, 19))).toBeFalse();
        expect(rect.atPosition(0, 0).collidesWith(circle.atPosition(10, 19))).toBeTrue();
    });

    it('detects if a given (x, y) position is within the boundary', () => {
        const b = new RectBoundary(10, 10);

        expect(b.atPosition(50, 50).containsPosition(50, 50)).toBe(true);
        expect(b.atPosition(50, 50).containsPosition(55, 55)).toBe(true);
        expect(b.atPosition(50, 50).containsPosition(60, 60)).toBe(true);
        expect(b.atPosition(50, 50).containsPosition(50, 61)).toBe(false);
        expect(b.atPosition(50, 50).containsPosition(45, 45)).toBe(false);
        expect(b.atPosition(50, 50).containsPosition(45, 55)).toBe(false);
        expect(b.atPosition(50, 50).containsPosition(55, 45)).toBe(false);
    });
});

describe('CircleBoundary', () => {

    it('detects if a given (x, y) position is within the boundary', () => {
        const a = new CircleBoundary(6);

        expect(a.atPosition(10, 20).containsPosition(18, 22)).toBeTrue();
        expect(a.atPosition(10, 20).containsPosition(0, 0)).toBeFalse();
    });

    it('detects when overlapping with a CircleBoundary', () => {
        const circle1 = new CircleBoundary(6);
        const circle2 = new CircleBoundary(8);

        expect(circle1.atPosition(10, 10).collidesWith(circle2.atPosition(20, 10))).toBeTrue();
        expect(circle1.atPosition(10, 10).collidesWith(circle2.atPosition(25, 10))).toBeFalse();
        expect(circle1.atPosition(10, 10).collidesWith(circle2.atPosition(0, 10))).toBeTrue();
        expect(circle1.atPosition(10, 10).collidesWith(circle2.atPosition(0, 25))).toBeFalse();
    })
});