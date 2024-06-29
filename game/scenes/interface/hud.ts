import { Game } from './../../../engine/game';
import Constants from './../../constants';

export function buildHUD(game: Game) {
    const hud = game.construct.defineScene('scnHUD', { width: 320, height: Constants.HUDHeight, persistent: true });
    hud.setBackground(game.construct.getSprite('sprSky'));

    hud.onStart((self, controller) => {
        console.log('hud.onStart');

        controller.state.hud = self;

        self.defaultCamera.width = 320;
        self.defaultCamera.height = 48;
        self.defaultCamera.portWidth = 1280;
        self.defaultCamera.portHeight = Constants.HUDHeight;

        self.instances.create('actButton', { x: 8, y: 8 });
        self.instances.create('actButton', { x: 96, y: 16 });

        self.state.currentlyIn = controller.sceneState.scene.name;
    });

    hud.onResume((self, controller) => {
        console.log('hud.onResume');

        self.state.currentlyIn = controller.sceneState.scene.name;
    });

    hud.onDraw((self, canvas, controller) => {
        canvas.drawText('Currently in: '+ self.state.currentlyIn, 200, 32, { color: '#03A' });
    });
}