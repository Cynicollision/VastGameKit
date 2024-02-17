import { GameInputHandler, InputEventHandler, KeyboardInputEvent, PointerInputEvent } from './../../engine/device';

export class MockInputHandler implements GameInputHandler {
    private keyboardEventHandlers: InputEventHandler<KeyboardInputEvent>[] = [];
    private pointerEventHandlers: InputEventHandler<PointerInputEvent>[] = [];

    currentX: number = 0;
    currentY: number = 0;

    registerKeyboardInputHandler(callback: (event: KeyboardInputEvent) => void): InputEventHandler<KeyboardInputEvent> {
        return new InputEventHandler<KeyboardInputEvent>(callback);
    }

    registerPointerInputHandler(callback: (event: PointerInputEvent) => void): InputEventHandler<PointerInputEvent> {
        return new InputEventHandler<PointerInputEvent>(callback);
    }

    raiseKeyboardEvent(event: KeyboardInputEvent): void {
        this.keyboardEventHandlers.forEach(handler => handler.callback(event));
    }
    
    raisePointerEvent(event: PointerInputEvent): void {
        this.pointerEventHandlers.forEach(handler => handler.callback(event));
    }
}