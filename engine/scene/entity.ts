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

export abstract class LifecycleEntityBase<T, U = T> {
    protected gameEventHandlerMap: { [eventName: string]: EntityLifecycleGameEventCb<U> } = {};
    protected keyboardInputEventHandlerMap: { [type: string]: EntityLifecycleKeyboardEventCb<U> } = {};
    protected pointerInputEventHandlerMap: { [type: string]: EntityLifecyclePointerEventCb<U> } = {};

    protected onLoadCallback: (actor: T) => void;
    protected onStepCallback: EntityLifecycleCb<U>;
    protected onDrawCallback: EntityLifecycleDrawCb<U>;

    callDraw(self: U, canvas: GameCanvas, sc: SceneController): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(self, canvas, sc);
        }
    }

    callGameEvent(self: U, event: GameEvent, sc: SceneController): void {
        if (this.gameEventHandlerMap[event.name]) {
            this.gameEventHandlerMap[event.name](self, event, sc);
        }
    }

    callKeyboardEvent(self: U, event: KeyboardInputEvent, sc: SceneController): void {
        if (this.keyboardInputEventHandlerMap[event.key]) {
            this.keyboardInputEventHandlerMap[event.key](self, event, sc);
        }
    }

    callPointerEvent(self: U, event: PointerInputEvent, sc: SceneController): void {
        if (this.pointerInputEventHandlerMap[event.type]) {
            this.pointerInputEventHandlerMap[event.type](self, event, sc);
        }
    }

    callStep(self: U, sc: SceneController): void {
        if (this.onStepCallback) {
            this.onStepCallback(self, sc);
        }
    }

    load(def: T): void {
        if (this.onLoadCallback) {
            this.onLoadCallback(def);
        }
    }

    onDraw(callback: EntityLifecycleDrawCb<U>): void {
        this.onDrawCallback = callback;
    }

    onGameEvent(eventName: string, callback: EntityLifecycleGameEventCb<U>): void {
        this.gameEventHandlerMap[eventName] = callback;
    }

    onKeyboardInput(key: string, callback: EntityLifecycleKeyboardEventCb<U>): void {
        this.keyboardInputEventHandlerMap[key] = callback;
    }

    onLoad(callback: (actor: T) => void): void {
        this.onLoadCallback = callback;
    }

    onPointerInput(type: string, callback: EntityLifecyclePointerEventCb<U>): void {
        this.pointerInputEventHandlerMap[type] = callback;
    }

    onStep(callback:  EntityLifecycleCb<U>): void {
        this.onStepCallback = callback;
    }
}
