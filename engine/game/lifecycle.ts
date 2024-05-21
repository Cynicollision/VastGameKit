import { GameCanvas, KeyboardInputEvent, PointerInputEvent } from './../device';
import { GameController } from './controller';
import { SceneStatus } from './../scene';

export class GameLifecycle {

    keyboardEvent(event: KeyboardInputEvent, gc: GameController): void {
        for (const layer of gc.currentScene.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                instance.actor.callKeyboardInput(instance, gc, event);
            }
        }
    }

    pointerEvent(event: PointerInputEvent, gc: GameController): void {
        event.x += gc.currentScene.camera.x;
        event.y += gc.currentScene.camera.y;

        for (const layer of gc.currentScene.getLayersSortedFromTop()) {
            for (const instance of layer.getInstances()) {
                if (instance.actor.boundary && instance.actor.boundary.atPosition(layer.x + instance.x, layer.y + instance.y).containsPosition(event.x, event.y)) {
                    instance.actor.callPointerInput(instance, gc, event);
                }
            }
        }
    }
    
    step(gc: GameController): void {

        switch (gc.currentScene.status) {
            case SceneStatus.Starting:
                gc.currentScene.start(gc);
                break;
            case SceneStatus.Resuming:
                gc.currentScene.resume(gc);
                break;
            case SceneStatus.Suspended:
                gc.currentScene.suspend(gc);
                break;
            case SceneStatus.Running:
                gc.currentScene.step(gc);
                break;
        }

        gc.flushEventQueue();
    }

    draw(gc: GameController, canvas: GameCanvas): void {
        gc.draw(canvas);
    }
}
