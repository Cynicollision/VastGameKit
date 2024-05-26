export enum ActorBehaviorName {
    BasicMotion = 'BasicMotion',
}

export enum Direction {
    Right = 0,
    Down = 90,
    Left = 180,
    Up = 270,
}

export enum InstanceStatus {
    Active = 'Active',
    Destroyed = 'Destroyed',
    Inactive = 'Inactive',
    New = 'New',
}

export enum LayerStatus {
    Active = 'Active',
    Destroyed = 'Destroyed',
    Inactive = 'Inactive',
    New = 'New',
}

export enum SceneStatus {
    NotStarted = 'NotStarted',
    Starting = 'Starting',
    Resuming = 'Resuming',
    Running = 'Running',
    Suspended = 'Suspended',
}

export enum SceneTransitionType {
    Fade = 'Fade',
}

export enum SpriteTransformation {
    Opacity = 0,
    Frame = 1,
    TileX = 2,
    TileY = 3,
}