import { RectBoundary } from './../engine/actor';

describe('RectBoundary', () => {

    it('detects collisions when boundaries overlap', () => {
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

    it('determines if a given (x, y) position is within the boundary', () => {
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
