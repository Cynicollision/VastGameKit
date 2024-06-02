import { Game } from './../../engine/game';

export function buildRoom1(game: Game) {
    const room1 = game.defineScene('room1', { persistent: false });
    room1.setBackground('#C00');

    room1.onStart((self, sc) => {
        console.log('room1.onStart');
        self.createInstance('actPlayer', { x: 32, y: 96 });
    })
    .onResume((self, sc) => {
        console.log('room1.onResume');
    });
}