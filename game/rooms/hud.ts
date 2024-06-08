import { Game } from './../../engine/game';

export function buildHUD(game: Game) {
    const hud = game.resources.defineScene('hud', { width: game.canvas.width, height: 120, persistent: false });
    hud.setBackground('#0F0');

    hud.onStart((self, sc) => {
        console.log('hud.onStart');

        self.instances.create('actButton', { x: 32, y: 32 });
        self.instances.create('actButton', { x: 96, y: 32 });

        self.state.currentlyIn = sc.scene.name;
    });

    hud.onResume((self, sc) => {
        console.log('hud.onResume');

        self.state.currentlyIn = sc.scene.name;
    });

    hud.onDraw((self, canvas, sc) => {
        canvas.drawText('Currently in: '+ self.state.currentlyIn, 200, 32, { color: '#03A' });
    });
}