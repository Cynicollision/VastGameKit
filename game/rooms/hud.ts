import { Game } from './../../engine/game';

export function buildHUD(game: Game) {
    const hud = game.construct.defineScene('hud', { width: game.canvas.width, height: 120, persistent: true });
    hud.setBackground('#0F0');

    hud.onStart((self, sc) => {
        console.log('hud.onStart');

        self.instances.create('actButton', 32, 32);
        self.instances.create('actButton', 96, 32);

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