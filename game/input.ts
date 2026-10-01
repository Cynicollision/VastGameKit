import { Controller, Direction } from './../engine';

const Keys: [Direction, string[]][] = [
    [Direction.Up, ['ArrowUp', 'w']],
    [Direction.Down, ['ArrowDown', 's']],
    [Direction.Left, ['ArrowLeft', 'a']],
    [Direction.Right, ['ArrowRight', 'd']],
];

function findDirection(test: (key: string) => boolean): Direction | undefined {
    const found = Keys.find(([, keys]) => keys.some(test));
    return found ? found[0] : undefined;
}

// The direction of a key pressed this step. On touch screens, the d-pad presses keys.
export function readPress(controller: Controller): Direction | undefined {
    return findDirection(key => controller.keyboard.wasPressed(key));
}

// The direction of a key being held down.
export function readHeld(controller: Controller): Direction | undefined {
    return findDirection(key => controller.keyboard.isDown(key));
}

export function wasStartPressed(controller: Controller): boolean {
    const keyboard = controller.keyboard;
    return keyboard.wasPressed('Enter') || keyboard.wasPressed(' ') || controller.pointer.wasReleased;
}
