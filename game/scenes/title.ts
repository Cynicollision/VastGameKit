import { Game } from './../../engine';
import { Colors, Screen } from './../constants';
import { wasStartPressed } from './../input';
import { getHighScore, newSession } from './../session';
import { isMuted, showTouchButtons, toggleMute, toggleTouchButtons, usesTouchButtons } from './../settings';
import { drawText } from './../text';

// the lines of settings, which can be tapped to change them.
const SoundY = 152;
const ControlsY = 166;

// The title screen: a Tiled map with the cat on a rooftop and traffic going by.
export function buildTitle(game: Game): void {
    const map = game.construction.tileMaps.get('mapTitle');
    const logo = game.construction.sprites.get('sprLogo');
    const font = game.construction.fonts.get('fntPixel');

    const title = game.construction.scenes.add('scnTitle', { width: map.pixelWidth, height: map.pixelHeight });
    title.background.setFromTileMap(map);

    title.onStart((self, controller) => {
        self.instances.createFromTileMapObjects(map, 'Actors');
        self.instances.createFromTileMapObjects(map, 'Lanes');
        self.state.clock = 0;
        showTouchButtons(controller, false, font);
    });

    title.onStep((self, controller) => {
        self.state.clock++;

        const pointer = controller.pointer;
        const tappedSetting = pointer.wasReleased && pointer.swipe === undefined && pointer.pressY >= SoundY - 4 && pointer.pressY < ControlsY + 12;

        if (controller.keyboard.wasPressed('m') || (tappedSetting && pointer.pressY < ControlsY - 2)) {
            toggleMute(controller);
        }
        else if (controller.keyboard.wasPressed('c') || (tappedSetting && pointer.pressY >= ControlsY - 2)) {
            toggleTouchButtons(controller);
        }
        else if (!self.state.starting && wasStartPressed(controller)) {
            self.state.starting = true;
            controller.state.session = newSession();
            controller.transitionToScene('scnLevel', { durationMs: 600, color: Colors.outline });
        }
    });

    title.onDraw((self, canvas, controller) => {
        const center = Screen.width / 2;
        drawText(canvas, `HI ${getHighScore(controller)}`, center, 6, { align: 'center', color: Colors.yellow });
        canvas.drawSprite(logo, Math.round((Screen.width - logo.width) / 2), 22);

        if (Math.floor(self.state.clock / 30) % 2 === 0) {
            drawText(canvas, 'PRESS START', center, 134, { align: 'center', color: Colors.yellow });
        }

        drawText(canvas, `${isMuted(controller) ? '🔇' : '🔊'} SOUND ${isMuted(controller) ? 'OFF' : 'ON'}`, center, SoundY, { align: 'center' });
        drawText(canvas, `TOUCH: ${usesTouchButtons(controller) ? 'BUTTONS' : 'SWIPE'}`, center, ControlsY, { align: 'center' });
        drawText(canvas, 'ARROWS/SWIPE TO HOP', center, 228, { align: 'center' });
        drawText(canvas, 'M SOUND  P PAUSE', center, 242, { align: 'center' });
    });
}
