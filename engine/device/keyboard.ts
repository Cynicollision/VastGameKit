import { GameEvent } from './../core/event';
import { InputEventSubscription, InputHandler } from './input';

export class KeyboardInputEvent extends GameEvent {
    key: string;
    type: string;

    static fromKeyboardEvent(ev: KeyboardEvent): KeyboardInputEvent {
        return new KeyboardInputEvent(ev.key, ev.type);
    }

    constructor(key: string, type: string) {
        super(key);
        this.key = key;
        this.type = type;
    }
}

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