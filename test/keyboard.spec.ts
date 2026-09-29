import { KeyboardInputEvent } from './../engine/core';
import { GameKeyboardState, KeyboardInputHandler } from './../engine/device/keyboard';
import { TestUtil } from './testUtil';

function keyEvent(type: string, key: string, code: string, init: KeyboardEventInit = {}): KeyboardEvent {
    return new KeyboardEvent(type, { key: key, code: code, cancelable: true, bubbles: true, ...init });
}

describe('KeyboardInputHandler', () => {
    let target: HTMLElement;
    let blurTarget: EventTarget;
    let handler: KeyboardInputHandler;
    let received: KeyboardInputEvent[];

    beforeEach(() => {
        target = document.createElement('div');
        blurTarget = new EventTarget();
        handler = KeyboardInputHandler.initForElement(target, blurTarget);
        received = [];
        handler.subscribe(ev => received.push(ev));
    });

    it('reports letter keys in lowercase', () => {
        target.dispatchEvent(keyEvent('keydown', 'W', 'KeyW', { shiftKey: true }));

        expect([received[0].key, received[0].code, received[0].type]).toEqual(['w', 'KeyW', 'keydown']);
    });

    it('reports a keyup with the key it went down as, even if a modifier changed it', () => {
        target.dispatchEvent(keyEvent('keydown', '1', 'Digit1'));
        target.dispatchEvent(keyEvent('keyup', '!', 'Digit1', { shiftKey: true }));

        expect(received.map(ev => [ev.key, ev.type])).toEqual([['1', 'keydown'], ['1', 'keyup']]);
    });

    it('flags repeated keydowns', () => {
        target.dispatchEvent(keyEvent('keydown', 'a', 'KeyA'));
        target.dispatchEvent(keyEvent('keydown', 'a', 'KeyA', { repeat: true }));

        expect(received.map(ev => ev.repeat)).toEqual([false, true]);
    });

    it('ignores keys typed into editable elements', () => {
        const input = document.createElement('input');
        target.appendChild(input);

        input.dispatchEvent(keyEvent('keydown', 'a', 'KeyA'));
        input.dispatchEvent(keyEvent('keyup', 'a', 'KeyA'));

        expect(received.length).toBe(0);
    });

    it('releases held keys when focus is lost', () => {
        target.dispatchEvent(keyEvent('keydown', 'a', 'KeyA'));
        target.dispatchEvent(keyEvent('keydown', 'ArrowUp', 'ArrowUp'));
        blurTarget.dispatchEvent(new Event('blur'));
        target.dispatchEvent(keyEvent('keyup', 'a', 'KeyA'));

        expect(received.map(ev => [ev.key, ev.type])).toEqual([['a', 'keydown'], ['ArrowUp', 'keydown'], ['a', 'keyup'], ['ArrowUp', 'keyup']]);
    });

    it('prevents the default action of arrow keys and space only', () => {
        const arrow = keyEvent('keydown', 'ArrowDown', 'ArrowDown');
        const space = keyEvent('keydown', ' ', 'Space');
        const letter = keyEvent('keydown', 'a', 'KeyA');

        [arrow, space, letter].forEach(ev => target.dispatchEvent(ev));

        expect([arrow.defaultPrevented, space.defaultPrevented, letter.defaultPrevented]).toEqual([true, true, false]);
    });
});

describe('GameKeyboardState', () => {
    let keyboard: GameKeyboardState;

    beforeEach(() => {
        keyboard = new GameKeyboardState();
    });

    it('tracks held keys by key value or code, ignoring case', () => {
        keyboard.onEvent(new KeyboardInputEvent('w', 'keydown', 'KeyW'));

        expect([keyboard.isDown('w'), keyboard.isDown('W'), keyboard.isDown('KeyW'), keyboard.isDown('a')]).toEqual([true, true, true, false]);

        keyboard.onEvent(new KeyboardInputEvent('w', 'keyup', 'KeyW'));

        expect([keyboard.isDown('w'), keyboard.isDown('KeyW')]).toEqual([false, false]);
    });

    it('reports keys pressed and released since the previous step for one step', () => {
        keyboard.onEvent(new KeyboardInputEvent(' ', 'keydown', 'Space'));
        expect(keyboard.wasPressed(' ')).toBeFalse();

        keyboard.step();
        expect([keyboard.wasPressed(' '), keyboard.wasPressed('Space'), keyboard.wasReleased(' ')]).toEqual([true, true, false]);

        keyboard.onEvent(new KeyboardInputEvent(' ', 'keydown', 'Space', true));
        keyboard.step();
        expect(keyboard.wasPressed(' ')).toBeFalse();
        expect(keyboard.isDown(' ')).toBeTrue();

        keyboard.onEvent(new KeyboardInputEvent(' ', 'keyup', 'Space'));
        keyboard.step();
        expect([keyboard.wasReleased(' '), keyboard.isDown(' ')]).toEqual([true, false]);

        keyboard.step();
        expect(keyboard.wasReleased(' ')).toBeFalse();
    });

    it('reports a tap between steps as pressed and released', () => {
        keyboard.onEvent(new KeyboardInputEvent('x', 'keydown', 'KeyX'));
        keyboard.onEvent(new KeyboardInputEvent('x', 'keyup', 'KeyX'));
        keyboard.step();

        expect([keyboard.wasPressed('x'), keyboard.wasReleased('x'), keyboard.isDown('x')]).toEqual([true, true, false]);
    });

    it('keeps a key down while another key with the same value is held', () => {
        keyboard.onEvent(new KeyboardInputEvent('Shift', 'keydown', 'ShiftLeft'));
        keyboard.onEvent(new KeyboardInputEvent('Shift', 'keydown', 'ShiftRight'));
        keyboard.onEvent(new KeyboardInputEvent('Shift', 'keyup', 'ShiftLeft'));

        expect([keyboard.isDown('Shift'), keyboard.isDown('ShiftLeft'), keyboard.isDown('ShiftRight')]).toEqual([true, false, true]);
    });
});

describe('Controller keyboard', () => {
    it('is stepped with the controller and updated by keyboard events', () => {
        const testGame = TestUtil.getTestGame();
        let pressedInStep = false;
        testGame.controller.sceneState.scene.onStep((self, controller) => {
            pressedInStep = controller.keyboard.wasPressed('Enter');
        });
        testGame.controller.sceneState.startOrResume(testGame.controller);

        testGame.controller.onKeyboardEvent(new KeyboardInputEvent('Enter', 'keydown'));
        testGame.controller.step();

        expect(pressedInStep).toBeTrue();
        expect(testGame.controller.keyboard.isDown('Enter')).toBeTrue();
    });
});
