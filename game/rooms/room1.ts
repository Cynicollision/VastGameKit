import { Game } from './../../engine/game';

export function buildRoom1(game: Game) {
    const room1 = game.defineScene('room1', { persistent: false });
    room1.setBackground('#C00');
    // const hud2 = room1.defineLayer('hud2', { height: 64, width: 800, x: 16, y: 16 })
    //     .setBackground(game.getSprite('sky'))
    //     .onDraw((self, canvas, sc) => {
    //         canvas.drawText('Hello HUD2', self.x + 100, self.y + 32);
    //     })

    room1.onStart((self, sc) => {
        console.log('room1.onStart');
        const one = self.createInstance('actPlayer', 32, 96);
    })
    .onResume((self, sc) => {
        console.log('room1.onResume');
    });
}