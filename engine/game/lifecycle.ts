import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameState } from './state';
import { RoomStatus } from './../room';

export class GameLifecycle {

    keyboardEvent(event: KeyboardInputEvent, state: GameState): void {
        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getActorInstances()) {
                instance.actor.callKeyboardInput(instance, state, event);
            }
        }
    }

    pointerEvent(event: PointerInputEvent, state: GameState): void {
        event.x += state.currentRoom.camera.x;
        event.y += state.currentRoom.camera.y;

        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getActorInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(layer.x + instance.x, layer.y + instance.y).containsPosition(event.x, event.y)) {
                    instance.actor.callPointerInput(instance, state, event);
                }
            }
        }
    }
    
    step(state: GameState): void {

        if (state.currentRoom.status === RoomStatus.Starting) {
            state.currentRoom.start(state);
        }
        else if (state.currentRoom.status === RoomStatus.Resuming) {
            state.currentRoom.resume(state);
        }
        else if (state.currentRoom.status === RoomStatus.Suspended) {
            state.currentRoom.suspend(state);
            return;
        }

        state.currentRoom.step(state);
        state.flushEventQueue();
    }

    draw(state: GameState, canvas: GameCanvas): void {
        canvas.setOrigin(-state.currentRoom.camera.x, -state.currentRoom.camera.y);
        canvas.clear();

        for (const layer of state.currentRoom.getLayersSortedFromBottom()) {
            layer.draw(state, canvas);

            for (const instance of layer.getActorInstances()) {
                instance.draw(state, canvas);
            }
        }
    }
}
