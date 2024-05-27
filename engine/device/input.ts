import { GameEvent } from './../core/events';
import { KeyboardInputHandler } from './keyboard';
import { PointerInputHandler } from './pointer';

export interface InputHandler<T extends GameEvent> {
    subscribe(callback: (event: T) => void): InputEventSubscription<T>;
}

export class GameInputHandler {
    private _keyboardHandler: KeyboardInputHandler;
    get keyboard() { return this._keyboardHandler; }

    private _pointerHandler: PointerInputHandler;
    get pointer() { return this._pointerHandler; }

    static initForElement(target: HTMLElement): GameInputHandler {
        const keyboardHandler = KeyboardInputHandler.initForElement(target);
        const pointerHandler = PointerInputHandler.initForElement(target);
        return new GameInputHandler(keyboardHandler, pointerHandler);
    }
    
    constructor(keyboardHandler: KeyboardInputHandler, pointerHandler: PointerInputHandler) {
        this._keyboardHandler = keyboardHandler;
        this._pointerHandler = pointerHandler;
    }
}

export class InputEventSubscription<T> {
    callback: (event: T) => void;
    isAlive: boolean = true;

    constructor(callback: (event: T) => void) {
        this.callback = callback;
    }

    get isActive(): boolean {
        return this.isAlive;
    }

    dispose(): void {
        this.isAlive = false;
    }
}