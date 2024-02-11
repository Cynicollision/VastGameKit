import { GameInputHandler, InputEventHandler, PointerInputEvent } from './../../engine/device';

export class MockInputHandler implements GameInputHandler {
    currentX: number = 0;
    currentY: number = 0;
    registerPointerInputHandler(callback: (event: PointerInputEvent) => void): InputEventHandler<PointerInputEvent> {
        return new InputEventHandler<PointerInputEvent>(callback);
    }
    registerKeyboardInputHandler(callback: (event: KeyboardEvent) => void): InputEventHandler<KeyboardEvent> {
        return new InputEventHandler<KeyboardEvent>(callback);
    }
}