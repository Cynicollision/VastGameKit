import { KeyboardInputEvent, PointerInputEvent } from './../core';
import { BitmapFont } from './../resources/bitmapFont';
import { GameCanvas } from './canvas';

export type TouchButtonOptions = {
    // the key the button presses, e.g. 'ArrowLeft' or ' '.
    key: string;
    // the key's code (see KeyboardInputEvent). Default: guessed from the key, e.g. 'KeyZ' for 'z' or 'Space' for ' '.
    code?: string;
    // in canvas coordinates.
    x: number;
    y: number;
    width: number;
    height: number;
    // Default 'rect'. A circle fills the smaller of width and height.
    shape?: 'rect' | 'circle';
    label?: string;
    // the label's font. Default: a bold sans-serif a third of the button's size.
    font?: string | BitmapFont;
};

export type TouchDPadKeys = {
    up: string;
    down: string;
    left: string;
    right: string;
};

export type TouchDPadOptions = {
    // the pad's center and radius, in canvas coordinates.
    x: number;
    y: number;
    radius: number;
    // the keys pressed by pointing up, down, left, and right of the center. Default: the arrow keys.
    keys?: TouchDPadKeys;
    // how far from the center a touch must be to press a key, as a fraction of the radius. Default 0.25.
    deadZone?: number;
    // the angle, in degrees, of a gap around each diagonal that doesn't start pressing either of its directions, for
    // games without diagonal moves, so a touch a little off of one direction doesn't press its neighbor. A key already
    // pressed stays pressed in a gap beside it. Default 0: no gaps.
    diagonalGap?: number;
    // the arrows' font. Default: a bold sans-serif a third of the pad's radius.
    font?: string | BitmapFont;
};

// When touch buttons show: 'touch' once the player has touched the screen, 'always', or 'never'.
export type TouchControlsVisibility = 'touch' | 'always' | 'never';

type TouchButton = Required<Omit<TouchButtonOptions, 'label' | 'font'>> & {
    label?: string;
    font?: string | BitmapFont;
    pressed: boolean;
};

type TouchDPad = Required<Omit<TouchDPadOptions, 'font'>> & {
    font?: string | BitmapFont;
    // the key pressed, if any.
    pressed?: string;
};

// where a pointer that started on a control is, and whether it started on the d-pad.
type ControlPointer = { x: number; y: number; onPad: boolean };

const ArrowKeys: TouchDPadKeys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

// On-screen buttons that press keyboard keys, so games played with a keyboard can be played on touch screens.
// Touches that start on a button slide between buttons (like a d-pad) and don't reach the game as pointer input.
// A d-pad presses one of four keys for the direction a touch that started on it is from its center, even once the
// touch slides off of it, so a thumb can rest on it and rock between directions.
export class TouchControls {
    visibility: TouchControlsVisibility = 'touch';

    private buttons: TouchButton[] = [];
    private pad?: TouchDPad;
    private touched = false;
    // pointers that started on a control, and where they are.
    private readonly controlPointers = new Map<number, ControlPointer>();

    // whether the controls are showing and can be pressed.
    get visible(): boolean {
        const hasControls = this.buttons.length > 0 || !!this.pad;
        return hasControls && (this.visibility === 'always' || (this.visibility === 'touch' && this.touched));
    }

    private static guessCode(key: string): string {
        if (key === ' ') {
            return 'Space';
        }
        if (/^[a-z]$/i.test(key)) {
            return `Key${key.toUpperCase()}`;
        }
        if (/^[0-9]$/.test(key)) {
            return `Digit${key}`;
        }
        return key;
    }

    private static contains(button: TouchButton, x: number, y: number): boolean {
        if (button.shape === 'circle') {
            const radius = Math.min(button.width, button.height) / 2;
            const dx = x - (button.x + button.width / 2);
            const dy = y - (button.y + button.height / 2);
            return dx * dx + dy * dy <= radius * radius;
        }

        return x >= button.x && x < button.x + button.width && y >= button.y && y < button.y + button.height;
    }

    private static padContains(pad: TouchDPad, x: number, y: number): boolean {
        const dx = x - pad.x;
        const dy = y - pad.y;
        return dx * dx + dy * dy <= pad.radius * pad.radius;
    }

    // The key for the direction a position is from the pad's center: along whichever axis it's farther. Near a
    // diagonal, it's the key already pressed if that's one of the diagonal's two directions, and otherwise none.
    private static padKey(pad: TouchDPad, x: number, y: number): string | undefined {
        const dx = x - pad.x;
        const dy = y - pad.y;
        const deadZone = pad.radius * pad.deadZone;
        if (dx * dx + dy * dy < deadZone * deadZone) {
            return undefined;
        }

        const horizontal = dx > 0 ? pad.keys.right : pad.keys.left;
        const vertical = dy > 0 ? pad.keys.down : pad.keys.up;

        // degrees from the nearest diagonal, from 0 on it to 45 on an axis.
        const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
        if (Math.abs(angle - 45) < pad.diagonalGap / 2) {
            return pad.pressed === horizontal || pad.pressed === vertical ? pad.pressed : undefined;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? pad.keys.right : pad.keys.left;
        }

        return dy > 0 ? pad.keys.down : pad.keys.up;
    }

    // The pointer moving the d-pad, if any: the first one that started on it.
    private get padPointer(): ControlPointer | undefined {
        return Array.from(this.controlPointers.values()).find(pointer => pointer.onPad);
    }

    // Presses and releases controls for where the control pointers are, raising keyboard events for the changes.
    private update(raise: (event: KeyboardInputEvent) => void): void {
        const buttonPointers = Array.from(this.controlPointers.values()).filter(pointer => !pointer.onPad);

        for (const button of this.buttons) {
            const pressed = buttonPointers.some(pointer => TouchControls.contains(button, pointer.x, pointer.y));
            if (pressed !== button.pressed) {
                button.pressed = pressed;
                raise(new KeyboardInputEvent(button.key, pressed ? 'keydown' : 'keyup', button.code));
            }
        }

        const pad = this.pad;
        if (pad) {
            const padPointer = this.padPointer;
            const key = padPointer ? TouchControls.padKey(pad, padPointer.x, padPointer.y) : undefined;
            if (key !== pad.pressed) {
                if (pad.pressed) {
                    raise(new KeyboardInputEvent(pad.pressed, 'keyup', TouchControls.guessCode(pad.pressed)));
                }
                if (key) {
                    raise(new KeyboardInputEvent(key, 'keydown', TouchControls.guessCode(key)));
                }
                pad.pressed = key;
            }
        }
    }

    // Releases every control's pointers, raising keyboard events for the keys that were pressed.
    private releaseAll(raise?: (event: KeyboardInputEvent) => void): void {
        this.controlPointers.clear();
        if (raise) {
            this.update(raise);
        }
    }

    // Replaces the buttons, releasing any controls that were pressed.
    setButtons(buttons: TouchButtonOptions[], raise?: (event: KeyboardInputEvent) => void): void {
        this.releaseAll(raise);

        this.buttons = buttons.map(options => ({
            ...options,
            code: options.code || TouchControls.guessCode(options.key),
            shape: options.shape || 'rect',
            pressed: false,
        }));
    }

    // Replaces the d-pad, or removes it, releasing any controls that were pressed.
    setDPad(options: TouchDPadOptions | undefined, raise?: (event: KeyboardInputEvent) => void): void {
        this.releaseAll(raise);

        this.pad = options ? {
            ...options,
            keys: options.keys || ArrowKeys,
            deadZone: options.deadZone !== undefined ? options.deadZone : 0.25,
            diagonalGap: options.diagonalGap || 0,
            pressed: undefined,
        } : undefined;
    }

    // Presses controls for pointer events, returning whether the event was used by the controls.
    handlePointerEvent(event: PointerInputEvent, raise: (event: KeyboardInputEvent) => void): boolean {
        if (event.pointerType === 'touch') {
            this.touched = true;
        }

        const id = event.pointerId;
        const pointer = this.controlPointers.get(id);

        if (event.type === 'pointerdown' && this.visible && this.pad && TouchControls.padContains(this.pad, event.x, event.y)) {
            this.controlPointers.set(id, { x: event.x, y: event.y, onPad: true });
        }
        else if (event.type === 'pointerdown' && this.visible && this.buttons.some(button => TouchControls.contains(button, event.x, event.y))) {
            this.controlPointers.set(id, { x: event.x, y: event.y, onPad: false });
        }
        else if (event.type === 'pointermove' && pointer) {
            pointer.x = event.x;
            pointer.y = event.y;
        }
        else if (event.type === 'pointerup' && pointer) {
            this.controlPointers.delete(id);
        }
        else {
            return false;
        }

        this.update(raise);
        return true;
    }

    draw(canvas: GameCanvas): void {
        if (!this.visible) {
            return;
        }

        for (const button of this.buttons) {
            const opacity = button.pressed ? 0.5 : 0.25;
            const centerX = button.x + button.width / 2;
            const centerY = button.y + button.height / 2;

            if (button.shape === 'circle') {
                canvas.fillCircle('#fff', centerX, centerY, Math.min(button.width, button.height) / 2, { opacity: opacity });
            }
            else {
                canvas.fillArea('#fff', button.x, button.y, button.width, button.height, { opacity: opacity });
            }

            if (button.label) {
                const fontSize = Math.max(8, Math.round(Math.min(button.width, button.height) / 3));
                const font = button.font || `bold ${fontSize}px sans-serif`;
                canvas.drawText(button.label, centerX, centerY, { align: 'center', baseline: 'middle', color: '#fff', font: font, opacity: 0.8 });
            }
        }

        if (this.pad) {
            this.drawPad(canvas, this.pad);
        }
    }

    // A disc with an arrow toward each direction, and a knob that follows the touch moving it. The disc is dark with a
    // light rim, so it shows over light and dark backgrounds alike.
    private drawPad(canvas: GameCanvas, pad: TouchDPad): void {
        canvas.fillCircle('#000', pad.x, pad.y, pad.radius, { opacity: 0.25 });
        canvas.drawCircle('#fff', pad.x, pad.y, pad.radius - 0.5, { opacity: 0.4 });

        const knobRadius = pad.radius * 0.4;
        const padPointer = this.padPointer;
        let knobX = pad.x;
        let knobY = pad.y;
        if (padPointer) {
            // the knob stays on the pad when the touch slides off of it.
            const dx = padPointer.x - pad.x;
            const dy = padPointer.y - pad.y;
            const reach = pad.radius - knobRadius;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const scale = distance > reach ? reach / distance : 1;
            knobX += dx * scale;
            knobY += dy * scale;
        }
        canvas.fillCircle('#fff', knobX, knobY, knobRadius, { opacity: padPointer ? 0.5 : 0.3 });

        const fontSize = Math.max(8, Math.round(pad.radius / 3));
        const font = pad.font || `bold ${fontSize}px sans-serif`;
        const arrowDistance = pad.radius * 0.7;
        const arrows: [string, string, number, number][] = [
            [pad.keys.up, '▲', 0, -1],
            [pad.keys.down, '▼', 0, 1],
            [pad.keys.left, '◀', -1, 0],
            [pad.keys.right, '▶', 1, 0],
        ];

        for (const [key, label, dx, dy] of arrows) {
            const opacity = pad.pressed === key ? 1 : 0.6;
            canvas.drawText(label, pad.x + dx * arrowDistance, pad.y + dy * arrowDistance, { align: 'center', baseline: 'middle', color: '#fff', font: font, opacity: opacity });
        }
    }
}
