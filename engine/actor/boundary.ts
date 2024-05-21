export { CircleBoundary, PositionedCircleBoundary } from './boundaries/circleBoundary';
export { RectBoundary, PositionedRectBoundary } from './boundaries/rectangleBoundary';

export interface Boundary {
    atPosition(x: number, y: number): PositionedBoundary;
    height: number;
    width: number;
}

export interface PositionedBoundary {
    collidesWith(other: PositionedBoundary): boolean;
    containsPosition(x: number, y: number): boolean;
}
