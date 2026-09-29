import { KeyboardInputEvent, PointerInputEvent } from './../engine/core';
import { GameCanvasHtml2D } from './../engine/device/canvas';
import { TouchControls } from './../engine/device/touchControls';
import { Game } from './../engine/game';
import { TestUtil } from './testUtil';

function touch(type: string, x: number, y: number, pointerId: number = 1, pointerType: string = 'touch'): PointerInputEvent {
    return new PointerInputEvent(type, x, y, undefined, { pointerId: pointerId, pointerType: pointerType });
}

describe('TouchControls', () => {
    let controls: TouchControls;
    let raised: string[];
    const raise = (ev: KeyboardInputEvent): void => { raised.push(`${ev.type} ${ev.key} ${ev.code}`); };

    beforeEach(() => {
        controls = new TouchControls();
        raised = [];
        controls.setButtons([
            { key: 'ArrowLeft', x: 0, y: 100, width: 20, height: 20 },
            { key: 'ArrowRight', x: 20, y: 100, width: 20, height: 20 },
            { key: 'z', x: 100, y: 100, width: 20, height: 20, shape: 'circle', label: 'A' },
        ]);
    });

    it('stays hidden, ignoring the mouse, until the screen is touched', () => {
        expect(controls.handlePointerEvent(touch('pointerdown', 5, 105, 1, 'mouse'), raise)).toBeFalse();
        expect(controls.visible).toBeFalse();

        expect(controls.handlePointerEvent(touch('pointerdown', 5, 105, 2), raise)).toBeTrue();
        expect(controls.visible).toBeTrue();
        expect(raised).toEqual(['keydown ArrowLeft ArrowLeft']);
    });

    it('presses keys while touched, with codes guessed from the keys', () => {
        controls.visibility = 'always';

        controls.handlePointerEvent(touch('pointerdown', 110, 110), raise);
        controls.handlePointerEvent(touch('pointerup', 110, 110), raise);

        expect(raised).toEqual(['keydown z KeyZ', 'keyup z KeyZ']);
    });

    it('only presses circle buttons within the circle', () => {
        controls.visibility = 'always';

        expect(controls.handlePointerEvent(touch('pointerdown', 101, 101), raise)).toBeFalse();
    });

    it('slides between buttons', () => {
        controls.visibility = 'always';

        controls.handlePointerEvent(touch('pointerdown', 5, 105), raise);
        controls.handlePointerEvent(touch('pointermove', 25, 105), raise);
        controls.handlePointerEvent(touch('pointermove', 60, 105), raise);

        expect(raised).toEqual(['keydown ArrowLeft ArrowLeft', 'keyup ArrowLeft ArrowLeft', 'keydown ArrowRight ArrowRight', 'keyup ArrowRight ArrowRight']);
    });

    it('does not press buttons for touches that started elsewhere', () => {
        controls.visibility = 'always';

        expect(controls.handlePointerEvent(touch('pointerdown', 60, 50), raise)).toBeFalse();
        expect(controls.handlePointerEvent(touch('pointermove', 5, 105), raise)).toBeFalse();
        expect(raised).toEqual([]);
    });

    it('keeps a button pressed while any touch is on it', () => {
        controls.visibility = 'always';

        controls.handlePointerEvent(touch('pointerdown', 5, 105, 1), raise);
        controls.handlePointerEvent(touch('pointerdown', 6, 106, 2), raise);
        controls.handlePointerEvent(touch('pointerup', 5, 105, 1), raise);

        expect(raised).toEqual(['keydown ArrowLeft ArrowLeft']);
    });

    it('releases pressed buttons when replaced', () => {
        controls.visibility = 'always';
        controls.handlePointerEvent(touch('pointerdown', 5, 105), raise);

        controls.setButtons([], raise);

        expect(raised).toEqual(['keydown ArrowLeft ArrowLeft', 'keyup ArrowLeft ArrowLeft']);
        expect(controls.visible).toBeFalse();
    });

    it('draws only while visible', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 120, height: 120 });
        const alphaAt = (x: number, y: number): number => canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data[3];

        controls.draw(canvas);
        expect(alphaAt(5, 105)).toBe(0);

        controls.visibility = 'always';
        controls.draw(canvas);
        expect(alphaAt(5, 105)).toBeGreaterThan(0);
        expect(alphaAt(110, 110)).toBeGreaterThan(0);
    });
});

describe('Controller touch buttons', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.controller.setTouchButtons([{ key: ' ', x: 0, y: 0, width: 50, height: 50 }]);
        testGame.controller.sceneState.startOrResume(testGame.controller);
    });

    it('presses keys for the keyboard state and keyboard handlers, instead of acting as the pointer', () => {
        const handled: string[] = [];
        testGame.controller.sceneState.scene.onKeyboardInput(' ', (self, ev) => handled.push(ev.type));

        testGame.controller.onPointerEvent(touch('pointerdown', 10, 10));
        testGame.controller.step();

        expect(testGame.controller.keyboard.wasPressed('Space')).toBeTrue();
        expect(handled).toEqual(['keydown']);
        expect(testGame.controller.pointer.wasPressed).toBeFalse();
    });

    it('leaves other touches to the pointer', () => {
        testGame.controller.onPointerEvent(touch('pointerdown', 100, 100));
        testGame.controller.step();

        expect(testGame.controller.pointer.wasPressed).toBeTrue();
        expect(testGame.controller.keyboard.isDown(' ')).toBeFalse();
    });
});
