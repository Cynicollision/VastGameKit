import { Controller, Direction } from './../engine';
import { HudHeight } from './constants';

const Keys: [Direction, string[]][] = [
    [Direction.Up, ['ArrowUp', 'w']],
    [Direction.Down, ['ArrowDown', 's']],
    [Direction.Left, ['ArrowLeft', 'a']],
    [Direction.Right, ['ArrowRight', 'd']],
];

// The direction the player asked to hop this step: a key pressed or held, a swipe, or a tap (which hops up). Taps on the
// HUD are its own.
export function readHop(controller: Controller): Direction | undefined {
    const keyboard = controller.keyboard;
    const pressed = Keys.find(([, keys]) => keys.some(key => keyboard.wasPressed(key)));
    if (pressed) {
        return pressed[0];
    }

    const pointer = controller.pointer;
    if (pointer.swipe !== undefined) {
        return pointer.swipe;
    }
    if (pointer.wasReleased && pointer.pressY >= HudHeight) {
        return Direction.Up;
    }

    // holding a key keeps hopping.
    const held = Keys.find(([, keys]) => keys.some(key => keyboard.isDown(key)));
    return held ? held[0] : undefined;
}

export function wasStartPressed(controller: Controller): boolean {
    const keyboard = controller.keyboard;
    return keyboard.wasPressed('Enter') || keyboard.wasPressed(' ') || (controller.pointer.wasReleased && controller.pointer.swipe === undefined);
}
