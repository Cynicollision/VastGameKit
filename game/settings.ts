import { BitmapFont, Controller } from './../engine';
import { Screen } from './constants';

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

// Which bottom corner of the level the d-pad sits in, chosen when a game is started by touch.
export type PadSide = 'left' | 'right';

export function getPadSide(controller: Controller): PadSide {
    return controller.storage.get('padSide', 'right');
}

export function setPadSide(controller: Controller, side: PadSide): void {
    controller.storage.set('padSide', side);
}

// Shows a d-pad over a bottom corner of the level once the player touches the screen, so one thumb can steer the cat.
export function showTouchPad(controller: Controller, show: boolean, font: BitmapFont): void {
    const radius = 28;
    const margin = 6;
    const x = getPadSide(controller) === 'left' ? margin + radius : Screen.width - margin - radius;
    controller.setTouchDPad(show ? { x: x, y: Screen.height - margin - radius, radius: radius, font: font } : undefined);
}
