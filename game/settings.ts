import { BitmapFont, Controller, TouchButtonOptions } from './../engine';

// The player's choices, saved between visits.

// Sound starts off, since the game may be embedded in a page someone is reading.
export function isMuted(controller: Controller): boolean {
    return controller.storage.get('muted', true);
}

export function applySettings(controller: Controller): void {
    controller.audio.muted = isMuted(controller);
}

export function toggleMute(controller: Controller): void {
    controller.storage.set('muted', !isMuted(controller));
    applySettings(controller);
}

// Shows arrow buttons over the bottom corners of the level, once the player touches the screen.
export function showTouchButtons(controller: Controller, show: boolean, font: BitmapFont): void {
    const size = 32;
    const buttons: TouchButtonOptions[] = [
        { key: 'ArrowLeft', x: 4, y: 216, label: '◀' },
        { key: 'ArrowRight', x: 40, y: 216, label: '▶' },
        { key: 'ArrowUp', x: 204, y: 180, label: '▲' },
        { key: 'ArrowDown', x: 204, y: 216, label: '▼' },
    ].map(button => ({ ...button, width: size, height: size, font: font }));

    controller.setTouchButtons(show ? buttons : []);
}
