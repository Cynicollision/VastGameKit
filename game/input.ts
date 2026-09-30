import { Controller, Direction } from './../engine';

const Keys: [Direction, string[]][] = [
    [Direction.Up, ['ArrowUp', 'w']],
    [Direction.Down, ['ArrowDown', 's']],
    [Direction.Left, ['ArrowLeft', 'a']],
    [Direction.Right, ['ArrowRight', 'd']],
];

// The direction the player asked to hop this step: a key pressed or held. On touch screens, the arrow buttons press keys.
export function readHop(controller: Controller): Direction | undefined {
    const keyboard = controller.keyboard;
    const pressed = Keys.find(([, keys]) => keys.some(key => keyboard.wasPressed(key)));
    if (pressed) {
        return pressed[0];
    }

    // holding a key keeps hopping.
    const held = Keys.find(([, keys]) => keys.some(key => keyboard.isDown(key)));
    return held ? held[0] : undefined;
}

export function wasStartPressed(controller: Controller): boolean {
    const keyboard = controller.keyboard;
    return keyboard.wasPressed('Enter') || keyboard.wasPressed(' ') || controller.pointer.wasReleased;
}
