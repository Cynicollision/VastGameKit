import { Game } from './../../../engine';
import Constants from './../../constants';

export function buildHUD(game: Game) {
    const hud = game.construction.scenes.add('scnHUD', { width: game.canvas.width / 4, height: Constants.HUDHeight, persistent: true });
    hud.background.setFromSprite(game.construction.sprites.get('sprSky'));

    hud.onStart((self, controller) => {
        controller.state.hud = self;

        self.defaultCamera.width = game.canvas.width / 4;
        self.defaultCamera.height = 48;
        self.defaultCamera.portWidth = game.canvas.width;
        self.defaultCamera.portHeight = Constants.HUDHeight;

        self.instances.create('actButton', { x: 8, y: 8 });
        self.instances.create('actButton', { x: 96, y: 16 });

        self.state.currentlyIn = controller.sceneState.scene.name;
    });

    hud.onResume((self, controller) => {
        self.state.currentlyIn = controller.sceneState.scene.name;
    });

    hud.onDraw((self, canvas, controller) => {
        const player = controller.sceneState.instances.getAll('actPlayer')[0];
        const coins = player ? player.state.coins : 0;

        canvas.drawText(`Currently in: ${self.state.currentlyIn}    Coins: ${coins} (best ${controller.storage.get('bestCoins', 0)})`, 200, 32, { color: '#03A' });
        canvas.drawText('Move: WASD/arrows    Q: go to areas    M/E: open/close modal    Y/U/I: animate buttons    T: remove buttons', 200, 64, { color: '#03A' });
        canvas.drawText("Click: play a sound, or toggle a button's animation", 200, 96, { color: '#03A' });
    });
}