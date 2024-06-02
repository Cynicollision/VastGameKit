export interface Boundary {
    atPosition(x: number, y: number): PositionedBoundary;
    height: number;
    width: number;
}

export interface PositionedBoundary {
    collidesWith(other: PositionedBoundary): boolean;
    containsPosition(x: number, y: number): boolean;
}
