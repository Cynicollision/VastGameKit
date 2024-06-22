import { Game } from '../../engine/game';
import Constants from './../constants';

export function buildHUD(game: Game) {
    const hud = game.construct.defineScene('hud', { width: 1280, height: Constants.HUDHeight, persistent: true });
    hud.setBackground(game.construct.getSprite('sprSky'));

    hud.onStart((self, sc) => {
        console.log('hud.onStart');

        self.defaultCamera.width = 320;
        self.defaultCamera.height = 48;
        self.defaultCamera.portWidth = 1280;
        self.defaultCamera.portHeight = Constants.HUDHeight;

        self.instances.create('actButton', 8, 8);
        self.instances.create('actButton', 96, 16);

        self.state.currentlyIn = sc.sceneState.scene.name;
    });

    hud.onResume((self, sc) => {
        console.log('hud.onResume');

        self.state.currentlyIn = sc.sceneState.scene.name;
    });

    hud.onDraw((self, canvas, sc) => {
        canvas.drawText('Currently in: '+ self.state.currentlyIn, 200, 32, { color: '#03A' });
    });
}