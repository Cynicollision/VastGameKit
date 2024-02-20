import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameState } from './state';
import { RoomStatus } from './../room';

export class GameLifecycle {

    keyboardEvent(event: KeyboardInputEvent, state: GameState): void {
        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                instance.actor.callKeyboardInput(instance, state, event);
            }
        }
    }

    pointerEvent(event: PointerInputEvent, state: GameState): void {
        event.x += state.currentRoom.camera.x;
        event.y += state.currentRoom.camera.y;

        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(layer.x + instance.x, layer.y + instance.y).containsPosition(event.x, event.y)) {
                    instance.actor.callPointerInput(instance, state, event);
                }
            }
        }
    }
    
    step(state: GameState): void {

        switch (state.currentRoom.status) {
            case RoomStatus.Starting:
                state.currentRoom.start(state);
                break;
            case RoomStatus.Resuming:
                state.currentRoom.resume(state);
                break;
            case RoomStatus.Suspended:
                state.currentRoom.suspend(state);
                break;
            case RoomStatus.Running:
                state.currentRoom.step(state);
                break;
        }

        state.flushEventQueue();
    }

    draw(state: GameState, canvas: GameCanvas): void {
        state.currentRoom.draw(state, canvas);

        state.drawTransition(canvas);
    }
}
