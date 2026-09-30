export enum Direction {
    Right = 0,
    Down = 90,
    Left = 180,
    Up = 270,
}

export enum GameTimerStatus {
    Elapsed = 'Elapsed',
    Ticking = 'Ticking',
}

export enum InstanceStatus {
    Active = 'Active',
    Destroyed = 'Destroyed',
    Inactive = 'Inactive',
    New = 'New',
}

export enum SceneStatus {
    NotStarted = 'NotStarted',
    Running = 'Running',
    Suspended = 'Suspended',
}

export enum SpriteTransformation {
    Opacity = 0,
    Frame = 1,
    TileX = 2,
    TileY = 3,
    // scale and rotation apply around the sprite's center. A negative scale flips the sprite.
    ScaleX = 4,
    ScaleY = 5,
    // in degrees, clockwise.
    Rotation = 6,
}

