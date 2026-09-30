import { Game } from './../../engine';
import { Colors, HudHeight, Rules, Screen } from './../constants';
import { getHighScore, getSession } from './../session';
import { drawText } from './../text';

function pad(value: number): string {
    return `${value}`.padStart(6, '0');
}

// The score, lives, and time left, floated over the top of the level so it stays put as the camera moves.
export function buildHud(game: Game): void {
    const hud = game.construction.scenes.add('scnHud', { width: Screen.width, height: HudHeight });
    hud.background.setFromColor(Colors.outline);

    hud.onDraw((self, canvas, controller) => {
        const session = getSession(controller);

        drawText(canvas, `SCORE ${pad(session.score)}`, 8, 4);
        drawText(canvas, `HI ${pad(Math.max(session.score, getHighScore(controller)))}`, Screen.width - 8, 4, { align: 'right', color: Colors.yellow });
        drawText(canvas, `♥×${session.lives}`, 8, 18, { color: Colors.orange });

        // the time left, as a bar that runs out.
        const barWidth = 120;
        const barX = Screen.width - 8 - barWidth;
        const left = session.timeLeft / Rules.timeSteps;
        const color = left > 0.5 ? Colors.green : left > 0.25 ? Colors.yellow : Colors.red;
        drawText(canvas, 'TIME', barX - 4, 18, { align: 'right' });
        canvas.fillArea(Colors.gray, barX, 19, barWidth, 6, { opacity: 0.3 });
        canvas.fillArea(color, barX, 19, Math.ceil(barWidth * left), 6);
    });
}
