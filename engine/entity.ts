import { GameEvent, KeyboardInputEvent, ObjMap, PointerInputEvent } from './core';
import { GameCanvas } from './device/canvas';
import { Controller } from './controller';

export type EntityLifecycleCb<T> = {
    (self: T, sc: Controller, data?: any): void;
};

export type EntityLifecycleDrawCb<T> = {
    (self: T, canvas: GameCanvas, sc: Controller): void;
};

export type EntityLifecycleGameEventCb<T> = {
    (self: T, ev: GameEvent, sc: Controller): void;
};

export type EntityLifecycleKeyboardEventCb<T> = {
    (self: T, ev: KeyboardInputEvent, sc: Controller): void;
};

export type EntityLifecyclePointerEventCb<T> = {
    (self: T, ev: PointerInputEvent, sc: Controller): void;
};

export type FollowEntityOptions = {
    centerOnTarget?: boolean;
    offsetX?: number;
    offsetY?: number;
};

export type PositionedEntity = {
    height: number;
    width: number;
    x: number;
    y: number;
};

export abstract class LifecycleEntityBase<T, U = T> {
    protected gameEventHandlerMap: ObjMap<EntityLifecycleGameEventCb<U>> = {};
    protected keyboardInputEventHandlerMap: ObjMap<EntityLifecycleKeyboardEventCb<U>> = {};
    protected pointerInputEventHandlerMap: ObjMap<EntityLifecyclePointerEventCb<U>> = {};
    protected onStepCallback: EntityLifecycleCb<U>;
    protected onDrawCallback: EntityLifecycleDrawCb<U>;

    callDraw(self: U, canvas: GameCanvas, sc: Controller): void {
        if (this.onDrawCallback) {
            this.onDrawCallback(self, canvas, sc);
        }
    }

    callGameEvent(self: U, event: GameEvent, sc: Controller): void {
        if (this.gameEventHandlerMap[event.name]) {
            this.gameEventHandlerMap[event.name](self, event, sc);
        }
    }

    callKeyboardEvent(self: U, event: KeyboardInputEvent, sc: Controller): void {
        if (this.keyboardInputEventHandlerMap[event.key]) {
            this.keyboardInputEventHandlerMap[event.key](self, event, sc);
        }
    }

    callPointerEvent(self: U, event: PointerInputEvent, sc: Controller): void {
        if (this.pointerInputEventHandlerMap[event.type]) {
            this.pointerInputEventHandlerMap[event.type](self, event, sc);
        }
    }

    callStep(self: U, sc: Controller): void {
        if (this.onStepCallback) {
            this.onStepCallback(self, sc);
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

    onPointerInput(type: string, callback: EntityLifecyclePointerEventCb<U>): void {
        this.pointerInputEventHandlerMap[type] = callback;
    }

    onStep(callback:  EntityLifecycleCb<U>): void {
        this.onStepCallback = callback;
    }
}
