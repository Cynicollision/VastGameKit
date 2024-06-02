import { KeyboardInputEvent } from './../core';
import { InputEventSubscription, InputHandler } from './input';

export class KeyboardInputHandler implements InputHandler<KeyboardInputEvent> {
    private subscribers: InputEventSubscription<KeyboardInputEvent>[] = [];

    static initForElement(target: HTMLElement): KeyboardInputHandler {
        const handler = new KeyboardInputHandler();

        function raiseKeyboardEvent(ev: KeyboardInputEvent): void {
            handler.subscribers.forEach((handler: InputEventSubscription<KeyboardInputEvent>) => {
                if (handler.isActive) {
                    handler.callback(ev);
                }
            });
        }

        target.onkeydown = target.onkeyup = function(this: GlobalEventHandlers, ev: KeyboardEvent): void {
            raiseKeyboardEvent(KeyboardInputEvent.fromKeyboardEvent(ev));
        };

        return handler;
    }

    subscribe(callback: (event: KeyboardInputEvent) => void): InputEventSubscription<KeyboardInputEvent> {
        const keyboardHandler = new InputEventSubscription<KeyboardInputEvent>(callback);
        this.subscribers.push(keyboardHandler);
        return keyboardHandler;
    }
}