import { KeyboardInputEvent, PointerInputEvent } from './../engine/core';
import { GameCanvasHtml2D } from './../engine/device/canvas';
import { TouchControls } from './../engine/device/touchControls';
import { Game } from './../engine/game';
import { BitmapFont } from './../engine/resources/bitmapFont';
import { TestImage1 } from './mocks/testImages';
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

    it('draws labels in a sans-serif sized to the button, or the given font', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 120, height: 120 });
        const font = BitmapFont.new('fntTest', { source: TestImage1.Source, width: 8, height: 8, characters: 'AB' });
        spyOn(canvas, 'drawText');
        controls.visibility = 'always';

        controls.draw(canvas);
        controls.setButtons([{ key: 'z', x: 0, y: 0, width: 20, height: 20, label: 'B', font: font }]);
        controls.draw(canvas);

        expect((<jasmine.Spy>canvas.drawText).calls.argsFor(0)).toEqual(['A', 110, 110, jasmine.objectContaining({ font: 'bold 8px sans-serif' })]);
        expect((<jasmine.Spy>canvas.drawText).calls.argsFor(1)).toEqual(['B', 10, 10, jasmine.objectContaining({ font: font })]);
    });
});

describe('TouchControls d-pad', () => {
    let controls: TouchControls;
    let raised: string[];
    const raise = (ev: KeyboardInputEvent): void => { raised.push(`${ev.type} ${ev.key}`); };

    beforeEach(() => {
        controls = new TouchControls();
        controls.visibility = 'always';
        raised = [];
        controls.setDPad({ x: 50, y: 50, radius: 20 });
    });

    it('shows with no buttons', () => {
        expect(controls.visible).toBeTrue();
    });

    it('presses the arrow key for the direction a touch is from its center, along the farther axis', () => {
        controls.handlePointerEvent(touch('pointerdown', 50, 38), raise);
        controls.handlePointerEvent(touch('pointermove', 60, 45), raise);
        controls.handlePointerEvent(touch('pointermove', 45, 56), raise);
        controls.handlePointerEvent(touch('pointermove', 40, 52), raise);
        controls.handlePointerEvent(touch('pointerup', 40, 52), raise);

        expect(raised).toEqual([
            'keydown ArrowUp',
            'keyup ArrowUp', 'keydown ArrowRight',
            'keyup ArrowRight', 'keydown ArrowDown',
            'keyup ArrowDown', 'keydown ArrowLeft',
            'keyup ArrowLeft',
        ]);
    });

    it('presses nothing near its center', () => {
        expect(controls.handlePointerEvent(touch('pointerdown', 52, 47), raise)).toBeTrue();
        controls.handlePointerEvent(touch('pointermove', 50, 40), raise);
        controls.handlePointerEvent(touch('pointermove', 51, 51), raise);

        expect(raised).toEqual(['keydown ArrowUp', 'keyup ArrowUp']);
    });

    it('presses nothing in the gaps around the diagonals, unless a key beside the gap is already pressed', () => {
        controls.setDPad({ x: 50, y: 50, radius: 20, diagonalGap: 30 });

        // 40 degrees up and to the right of center: in the gap.
        controls.handlePointerEvent(touch('pointerdown', 50 + 10 * Math.cos(Math.PI * 40 / 180), 50 - 10 * Math.sin(Math.PI * 40 / 180)), raise);
        // 70 degrees: up. Then back into the gap, which keeps up pressed.
        controls.handlePointerEvent(touch('pointermove', 50 + 10 * Math.cos(Math.PI * 70 / 180), 50 - 10 * Math.sin(Math.PI * 70 / 180)), raise);
        controls.handlePointerEvent(touch('pointermove', 50 + 10 * Math.cos(Math.PI * 40 / 180), 50 - 10 * Math.sin(Math.PI * 40 / 180)), raise);
        // 20 degrees: right.
        controls.handlePointerEvent(touch('pointermove', 50 + 10 * Math.cos(Math.PI * 20 / 180), 50 - 10 * Math.sin(Math.PI * 20 / 180)), raise);
        // the gap down and to the left isn't beside right, so it releases right.
        controls.handlePointerEvent(touch('pointermove', 40, 60), raise);

        expect(raised).toEqual(['keydown ArrowUp', 'keyup ArrowUp', 'keydown ArrowRight', 'keyup ArrowRight']);
    });

    it('keeps following a touch that slides off of it', () => {
        controls.handlePointerEvent(touch('pointerdown', 50, 60), raise);
        expect(controls.handlePointerEvent(touch('pointermove', 100, 70), raise)).toBeTrue();

        expect(raised).toEqual(['keydown ArrowDown', 'keyup ArrowDown', 'keydown ArrowRight']);
    });

    it('ignores touches that start off of it, and uses the given keys', () => {
        controls.setDPad({ x: 50, y: 50, radius: 20, keys: { up: 'w', down: 's', left: 'a', right: 'd' } });

        expect(controls.handlePointerEvent(touch('pointerdown', 80, 50), raise)).toBeFalse();
        controls.handlePointerEvent(touch('pointerdown', 65, 50, 2), raise);

        expect(raised).toEqual(['keydown d']);
    });

    it('releases its key when removed', () => {
        controls.handlePointerEvent(touch('pointerdown', 50, 35), raise);

        controls.setDPad(undefined, raise);

        expect(raised).toEqual(['keydown ArrowUp', 'keyup ArrowUp']);
        expect(controls.visible).toBeFalse();
    });

    it('works alongside buttons', () => {
        controls.setButtons([{ key: 'z', x: 100, y: 100, width: 20, height: 20 }]);

        controls.handlePointerEvent(touch('pointerdown', 50, 35, 1), raise);
        controls.handlePointerEvent(touch('pointerdown', 110, 110, 2), raise);
        controls.handlePointerEvent(touch('pointermove', 110, 105, 1), raise);

        expect(raised).toEqual(['keydown ArrowUp', 'keydown z', 'keyup ArrowUp', 'keydown ArrowRight']);
    });

    it('draws a disc, a knob, and arrows', () => {
        const canvas = <GameCanvasHtml2D>GameCanvasHtml2D.initNewCanvas({ width: 120, height: 120 });
        const alphaAt = (x: number, y: number): number => canvas.canvas.getContext('2d')!.getImageData(x, y, 1, 1).data[3];
        spyOn(canvas, 'drawText').and.callThrough();

        controls.draw(canvas);

        expect(alphaAt(50, 50)).toBeGreaterThan(0);
        expect(alphaAt(50, 33)).toBeGreaterThan(0);
        expect(alphaAt(5, 5)).toBe(0);
        expect((<jasmine.Spy>canvas.drawText).calls.allArgs().map(args => args[0])).toEqual(['▲', '▼', '◀', '▶']);
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

    it('presses keys for a d-pad', () => {
        testGame.controller.setTouchDPad({ x: 100, y: 100, radius: 20 });

        testGame.controller.onPointerEvent(touch('pointerdown', 100, 85));
        testGame.controller.step();

        expect(testGame.controller.keyboard.isDown('ArrowUp')).toBeTrue();
        expect(testGame.controller.pointer.wasPressed).toBeFalse();
    });

    it('leaves other touches to the pointer', () => {
        testGame.controller.onPointerEvent(touch('pointerdown', 100, 100));
        testGame.controller.step();

        expect(testGame.controller.pointer.wasPressed).toBeTrue();
        expect(testGame.controller.keyboard.isDown(' ')).toBeFalse();
    });
});
