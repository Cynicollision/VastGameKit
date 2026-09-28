export interface Boundary {
    // offset of the Boundary's bounding box from the position it's placed at.
    readonly originX: number;
    readonly originY: number;
    readonly height: number;
    readonly width: number;
    atPosition(x: number, y: number): PositionedBoundary;
    // collision and containment checks that don't allocate PositionedBoundaries.
    collidesAt(x: number, y: number, other: Boundary, otherX: number, otherY: number): boolean;
    containsPositionAt(x: number, y: number, positionX: number, positionY: number): boolean;
}

export interface PositionedBoundary {
    collidesWith(other: PositionedBoundary): boolean;
    containsPosition(x: number, y: number): boolean;
}
