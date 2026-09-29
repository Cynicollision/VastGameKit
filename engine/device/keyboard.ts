import { KeyboardInputEvent } from './../core';
import { InputEventSubscription, InputHandler } from './input';

function isEditable(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
}

export class KeyboardInputHandler implements InputHandler<KeyboardInputEvent> {
    // keys whose default browser action (like scrolling the page) is prevented.
    readonly preventDefaultKeys = new Set<string>([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // the key value each held key had when it went down, by code, so a keyup reports the same key
    // even if a modifier changed in between (e.g. keydown 'w', Shift, keyup 'W').
    private readonly heldKeys = new Map<string, string>();
    private subscribers: InputEventSubscription<KeyboardInputEvent>[] = [];

    // Keyboard events typed into editable elements are ignored. When blurTarget loses focus, held keys are released,
    // since their keyups won't be received.
    static initForElement(target: HTMLElement, blurTarget: EventTarget = window): KeyboardInputHandler {
        const handler = new KeyboardInputHandler();
        target.addEventListener('keydown', ev => handler.onKeyDown(ev));
        target.addEventListener('keyup', ev => handler.onKeyUp(ev));
        blurTarget.addEventListener('blur', () => handler.releaseAll());
        return handler;
    }

    private onKeyDown(ev: KeyboardEvent): void {
        if (isEditable(ev.target)) {
            return;
        }

        const key = this.heldKeys.get(ev.code) || KeyboardInputEvent.normalizeKey(ev.key);
        this.heldKeys.set(ev.code, key);
        this.preventDefault(ev, key);
        this.raise(new KeyboardInputEvent(key, 'keydown', ev.code, ev.repeat));
    }

    private onKeyUp(ev: KeyboardEvent): void {
        const key = this.heldKeys.get(ev.code);

        if (key !== undefined) {
            this.heldKeys.delete(ev.code);
            this.preventDefault(ev, key);
            this.raise(new KeyboardInputEvent(key, 'keyup', ev.code));
        }
    }

    private preventDefault(ev: KeyboardEvent, key: string): void {
        if (this.preventDefaultKeys.has(key) || this.preventDefaultKeys.has(ev.code)) {
            ev.preventDefault();
        }
    }

    private raise(ev: KeyboardInputEvent): void {
        for (const subscriber of this.subscribers) {
            if (subscriber.isActive) {
                subscriber.callback(ev);
            }
        }
    }

    // Raises keyup events for all held keys.
    releaseAll(): void {
        const held = Array.from(this.heldKeys);
        this.heldKeys.clear();

        for (const [code, key] of held) {
            this.raise(new KeyboardInputEvent(key, 'keyup', code));
        }
    }

    subscribe(callback: (event: KeyboardInputEvent) => void): InputEventSubscription<KeyboardInputEvent> {
        const keyboardHandler = new InputEventSubscription<KeyboardInputEvent>(callback);
        this.subscribers.push(keyboardHandler);
        return keyboardHandler;
    }
}

// Which keys are held, and which were pressed or released since the previous step. Keys are key values
// (e.g. 'w', 'ArrowLeft', ' ') or codes (e.g. 'KeyW', 'Space'). See KeyboardInputEvent.
export interface KeyboardState {
    isDown(key: string): boolean;
    wasPressed(key: string): boolean;
    wasReleased(key: string): boolean;
}

export class GameKeyboardState implements KeyboardState {
    // held keys and codes, with how many held keys share each (e.g. ShiftLeft and ShiftRight are both 'Shift').
    private readonly down = new Map<string, number>();
    private pressed = new Set<string>();
    private released = new Set<string>();
    private nextPressed = new Set<string>();
    private nextReleased = new Set<string>();

    private press(name: string): void {
        const count = this.down.get(name) || 0;
        this.down.set(name, count + 1);

        if (count === 0) {
            this.nextPressed.add(name);
        }
    }

    private release(name: string): void {
        const count = this.down.get(name) || 0;

        if (count > 1) {
            this.down.set(name, count - 1);
        }
        else if (count === 1) {
            this.down.delete(name);
            this.nextReleased.add(name);
        }
    }

    isDown(key: string): boolean {
        return this.down.has(KeyboardInputEvent.normalizeKey(key));
    }

    wasPressed(key: string): boolean {
        return this.pressed.has(KeyboardInputEvent.normalizeKey(key));
    }

    wasReleased(key: string): boolean {
        return this.released.has(KeyboardInputEvent.normalizeKey(key));
    }

    onEvent(ev: KeyboardInputEvent): void {
        if (ev.type === 'keydown' && !ev.repeat) {
            this.press(ev.key);
            if (ev.code !== ev.key) {
                this.press(ev.code);
            }
        }
        else if (ev.type === 'keyup') {
            this.release(ev.key);
            if (ev.code !== ev.key) {
                this.release(ev.code);
            }
        }
    }

    // Starts a new step: keys pressed or released since the previous step become this step's pressed and released keys.
    step(): void {
        const pressed = this.pressed;
        const released = this.released;
        pressed.clear();
        released.clear();

        this.pressed = this.nextPressed;
        this.released = this.nextReleased;
        this.nextPressed = pressed;
        this.nextReleased = released;
    }
}
