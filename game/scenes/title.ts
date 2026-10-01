import { Controller, Game, GameCanvas, SceneState } from './../../engine';
import { Colors, Screen } from './../constants';
import { wasStartPressed } from './../input';
import { getHighScore, newSession } from './../session';
import { getPadSide, isMuted, PadSide, setPadSide, showTouchPad, toggleMute } from './../settings';
import { drawText } from './../text';

// the sound setting, which can be tapped to change it.
const SoundY = 156;

// Starting by touch first asks which side the d-pad goes on, with a choice for each side.
const SidePanel = { x: 24, y: 88, width: 192, height: 80 };
const SideChoices: { side: PadSide, label: string, x: number }[] = [
    { side: 'left', label: '◀ LEFT', x: 36 },
    { side: 'right', label: 'RIGHT ▶', x: 124 },
];
const SideChoiceY = 124;
const SideChoiceWidth = 80;
const SideChoiceHeight = 32;

function startGame(self: SceneState, controller: Controller): void {
    self.state.starting = true;
    controller.state.session = newSession();
    controller.audio.play('sndMeow');
    controller.transitionToScene('scnLevel', { durationMs: 600, color: Colors.outline });
}

// A tap on a side starts the game with the d-pad there. A tap outside the panel goes back.
function chooseSide(self: SceneState, controller: Controller): void {
    const pointer = controller.pointer;
    if (!pointer.wasReleased) {
        return;
    }

    const choice = SideChoices.find(choice => pointer.x >= choice.x && pointer.x < choice.x + SideChoiceWidth && pointer.y >= SideChoiceY && pointer.y < SideChoiceY + SideChoiceHeight);
    if (choice) {
        setPadSide(controller, choice.side);
        startGame(self, controller);
    }
    else if (pointer.x < SidePanel.x || pointer.x >= SidePanel.x + SidePanel.width || pointer.y < SidePanel.y || pointer.y >= SidePanel.y + SidePanel.height) {
        self.state.choosingSide = false;
    }
}

function drawSideChoices(canvas: GameCanvas, controller: Controller): void {
    const center = Screen.width / 2;
    canvas.fillArea(Colors.outline, 0, 0, Screen.width, Screen.height, { opacity: 0.5 });
    canvas.fillArea(Colors.outline, SidePanel.x, SidePanel.y, SidePanel.width, SidePanel.height);
    canvas.drawRect(Colors.white, SidePanel.x + 2.5, SidePanel.y + 2.5, SidePanel.width - 5, SidePanel.height - 5);
    drawText(canvas, 'ARROWS ON WHICH SIDE?', center, SidePanel.y + 14, { align: 'center', color: Colors.yellow });

    // the side chosen last time stands out.
    for (const choice of SideChoices) {
        const color = choice.side === getPadSide(controller) ? Colors.yellow : Colors.gray;
        canvas.drawRect(color, choice.x + 0.5, SideChoiceY + 0.5, SideChoiceWidth - 1, SideChoiceHeight - 1);
        drawText(canvas, choice.label, choice.x + SideChoiceWidth / 2, SideChoiceY + 12, { align: 'center', color: color });
    }
}

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
        showTouchPad(controller, false, font);
    });

    title.onStep((self, controller) => {
        self.state.clock++;

        if (self.state.starting) {
            return;
        }
        if (self.state.choosingSide) {
            chooseSide(self, controller);
            return;
        }

        const pointer = controller.pointer;
        const tappedSound = pointer.wasReleased && pointer.pressY >= SoundY - 4 && pointer.pressY < SoundY + 12;

        if (controller.keyboard.wasPressed('m') || tappedSound) {
            toggleMute(controller);
            controller.audio.play('sndSelect');
        }
        else if (wasStartPressed(controller)) {
            if (controller.pointer.wasReleased && controller.pointer.type === 'touch') {
                self.state.choosingSide = true;
                controller.audio.play('sndSelect');
            }
            else {
                startGame(self, controller);
            }
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
        drawText(canvas, 'HOP WITH THE ARROWS', center, 228, { align: 'center' });
        drawText(canvas, 'M SOUND  P PAUSE', center, 242, { align: 'center' });

        if (self.state.choosingSide) {
            drawSideChoices(canvas, controller);
        }
    });
}
