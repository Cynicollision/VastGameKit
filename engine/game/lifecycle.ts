import { GameCanvas, PointerInputEvent } from './../device';
import { GameState } from './state';
import { RoomStatus } from './../room';

export class GameLifecycle {

    keyboardEvent(event: KeyboardEvent, state: GameState): void {
        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getActorInstances()) {
                instance.actor.callKeyboardInput(instance, state, event);
            }
        }
    }

    pointerEvent(event: PointerInputEvent, state: GameState): void {
        // TODO: need to account for offsets before passing event
        // ++ view.x, view.y
        // -- layer.x, layer.y ??

        for (const layer of state.currentRoom.getLayersSortedFromTop()) {
            for (const instance of layer.getActorInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(event.x, event.y)) {
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
        canvas.clear();

        for (const layer of state.currentRoom.getLayersSortedFromBottom()) {
            layer.callDraw(state, canvas);

            for (const instance of layer.getActorInstances()) {
                instance.drawAnimation(canvas);
                instance.callDraw(state, canvas);
            }
        }
    }
}
