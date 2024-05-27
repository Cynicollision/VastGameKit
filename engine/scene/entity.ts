import { GameEvent, KeyboardInputEvent, PointerInputEvent } from './../core/events';
import { GameCanvas } from './../device/canvas';
import { SceneController } from './controller';

export type EntityLifecycleCb<T> = {
    (self: T, sc: SceneController): void;
};

export type EntityLifecycleDrawCb<T> = {
    (self: T, canvas: GameCanvas, sc: SceneController): void;
};

export type EntityLifecycleGameEventCb<T> = {
    (self: T, ev: GameEvent, sc: SceneController): void;
};

export type EntityLifecycleKeyboardEventCb<T> = {
    (self: T, ev: KeyboardInputEvent, sc: SceneController): void;
};

export type EntityLifecyclePointerEventCb<T> = {
    (self: T, ev: PointerInputEvent, sc: SceneController): void;
};

export interface LifecycleEntity<T, V> {
    onDraw(callback: EntityLifecycleDrawCb<V>): T;
    onGameEvent(eventName: string, callback: EntityLifecycleGameEventCb<V>): T;
    onLoad(callback: (entity: T) => void): T;
    onKeyboardInput(key: string, callback: EntityLifecycleKeyboardEventCb<V>): T;
    onPointerInput(type: string, callback: EntityLifecyclePointerEventCb<V>): T;
    onStep(callback: EntityLifecycleCb<V>): T;
}

export interface LifecycleEntityExecution<T> {
    draw(canvas: GameCanvas, sc: SceneController): void;
    handleGameEvent(self: T, ev: GameEvent, sc: SceneController): void;
    handleKeyboardEvent(self: T, ev: KeyboardInputEvent, sc: SceneController): void;
    handlePointerEvent(self: T, ev: PointerInputEvent, sc: SceneController): void;
    step(sc: SceneController): void;
}
