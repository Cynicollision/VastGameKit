import { KeyboardInputEvent, PointerInputEvent } from './../core';
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
};

// When touch buttons show: 'touch' once the player has touched the screen, 'always', or 'never'.
export type TouchControlsVisibility = 'touch' | 'always' | 'never';

type TouchButton = Required<Omit<TouchButtonOptions, 'label'>> & {
    label?: string;
    pressed: boolean;
};

// On-screen buttons that press keyboard keys, so games played with a keyboard can be played on touch screens.
// Touches that start on a button slide between buttons (like a d-pad) and don't reach the game as pointer input.
export class TouchControls {
    visibility: TouchControlsVisibility = 'touch';

    private buttons: TouchButton[] = [];
    private touched = false;
    // pointers that started on a button, and where they are.
    private readonly buttonPointers = new Map<number, { x: number; y: number }>();

    // whether the buttons are showing and can be pressed.
    get visible(): boolean {
        return this.buttons.length > 0 && (this.visibility === 'always' || (this.visibility === 'touch' && this.touched));
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

    // Presses and releases buttons for where the button pointers are, raising keyboard events for the changes.
    private update(raise: (event: KeyboardInputEvent) => void): void {
        for (const button of this.buttons) {
            let pressed = false;
            this.buttonPointers.forEach(position => {
                pressed = pressed || TouchControls.contains(button, position.x, position.y);
            });

            if (pressed !== button.pressed) {
                button.pressed = pressed;
                raise(new KeyboardInputEvent(button.key, pressed ? 'keydown' : 'keyup', button.code));
            }
        }
    }

    // Replaces the buttons, releasing any that were pressed.
    setButtons(buttons: TouchButtonOptions[], raise?: (event: KeyboardInputEvent) => void): void {
        this.buttonPointers.clear();
        if (raise) {
            this.update(raise);
        }

        this.buttons = buttons.map(options => ({
            ...options,
            code: options.code || TouchControls.guessCode(options.key),
            shape: options.shape || 'rect',
            pressed: false,
        }));
    }

    // Presses buttons for pointer events, returning whether the event was used by the buttons.
    handlePointerEvent(event: PointerInputEvent, raise: (event: KeyboardInputEvent) => void): boolean {
        if (event.pointerType === 'touch') {
            this.touched = true;
        }

        const id = event.pointerId;
        const isButtonPointer = this.buttonPointers.has(id);

        if (event.type === 'pointerdown' && this.visible && this.buttons.some(button => TouchControls.contains(button, event.x, event.y))) {
            this.buttonPointers.set(id, { x: event.x, y: event.y });
        }
        else if (event.type === 'pointermove' && isButtonPointer) {
            this.buttonPointers.set(id, { x: event.x, y: event.y });
        }
        else if (event.type === 'pointerup' && isButtonPointer) {
            this.buttonPointers.delete(id);
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
                canvas.drawText(button.label, centerX, centerY, { align: 'center', baseline: 'middle', color: '#fff', font: `bold ${fontSize}px sans-serif`, opacity: 0.8 });
            }
        }
    }
}
