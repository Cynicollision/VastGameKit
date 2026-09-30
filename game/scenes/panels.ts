import { Game, GameCanvas, SceneState } from './../../engine';
import { Colors, Screen } from './../constants';
import { wasStartPressed } from './../input';
import { getHighScore, getSession } from './../session';
import { drawText } from './../text';

// Panels float over the level as sub-scenes: pausing, game over, and a banner between rounds.

function drawPanel(canvas: GameCanvas, width: number, height: number): { x: number, y: number } {
    const x = Math.round((Screen.width - width) / 2);
    const y = Math.round((Screen.height - height) / 2);
    canvas.fillArea(Colors.outline, x, y, width, height);
    canvas.drawRect(Colors.white, x + 2.5, y + 2.5, width - 5, height - 5);
    return { x: x, y: y };
}

function buildPause(game: Game): void {
    // covers the screen, dimming the level, so a tap anywhere resumes.
    const pause = game.construction.scenes.add('scnPause', { width: Screen.width, height: Screen.height });
    pause.background.setFromColor(Colors.outline, { opacity: 0.5 });

    pause.onDraw((self, canvas) => {
        const panel = drawPanel(canvas, 144, 48);
        drawText(canvas, 'PAUSED', Screen.width / 2, panel.y + 12, { align: 'center', color: Colors.yellow });
        drawText(canvas, 'TAP OR P', Screen.width / 2, panel.y + 28, { align: 'center' });
    });

    pause.onPointerInput('pointerup', (self, event, controller) => controller.publishEvent('togglePause'));
}

function buildGameOver(game: Game): void {
    const gameOver = game.construction.scenes.add('scnGameOver', { width: Screen.width, height: Screen.height });
    gameOver.background.setFromColor(Colors.outline, { opacity: 0.5 });

    gameOver.onStart((self, controller) => {
        self.state.clock = 0;
        self.state.newHighScore = getSession(controller).score > 0 && getSession(controller).score >= getHighScore(controller);
    });

    gameOver.onStep((self, controller) => {
        self.state.clock++;
        // a moment to see the score before a key or tap goes back to the title.
        if (self.state.clock > 60 && !self.state.leaving && wasStartPressed(controller)) {
            self.state.leaving = true;
            controller.transitionToScene('scnTitle', { durationMs: 600, color: Colors.outline });
        }
    });

    gameOver.onDraw((self, canvas, controller) => {
        const panel = drawPanel(canvas, 176, 88);
        const blink = Math.floor(self.state.clock / 20) % 2 === 0;
        drawText(canvas, 'GAME OVER', Screen.width / 2, panel.y + 12, { align: 'center', color: Colors.red });
        drawText(canvas, `SCORE ${getSession(controller).score}`, Screen.width / 2, panel.y + 30, { align: 'center' });
        if (self.state.newHighScore && blink) {
            drawText(canvas, 'NEW HIGH SCORE!', Screen.width / 2, panel.y + 46, { align: 'center', color: Colors.yellow });
        }
        if (self.state.clock > 60) {
            drawText(canvas, 'PRESS START', Screen.width / 2, panel.y + 66, { align: 'center', color: Colors.cyan });
        }
    });
}

function buildBanner(game: Game): void {
    const banner = game.construction.scenes.add('scnBanner', { width: Screen.width, height: 24 });

    banner.onDraw((self, canvas) => {
        canvas.fillArea(Colors.outline, 0, 0, Screen.width, 24, { opacity: 0.75 });
        drawText(canvas, self.state.text || '', Screen.width / 2, 8, { align: 'center', color: Colors.yellow });
    });
}

// Shows a line of text across the middle of the screen for a moment.
export function showBanner(level: SceneState, text: string, durationSteps: number): void {
    const banner = level.floatSubScene('scnBanner', { x: 0, y: Math.round((Screen.height - 24) / 2), width: Screen.width, height: 24, depth: -5 });
    banner.sceneState.state.text = text;
    level.startTimer({ durationSteps: durationSteps }).onEnd(() => banner.destroy());
}

export function buildPanels(game: Game): void {
    buildPause(game);
    buildGameOver(game);
    buildBanner(game);
}
