import { SceneEmbedDisplayMode } from '../../engine/core';
import { Game } from './../../engine/game';

export function buildRoom1(game: Game) {
    const room1 = game.resources.defineScene('room1', { persistent: false });
    room1.setBackground('#C00');

    room1.embeds.create('hud', { x: 0, y: 0, displayMode: SceneEmbedDisplayMode.Float });

    room1.onStart((self, sc) => {
        console.log('room1.onStart');
        self.instances.create('actPlayer', { x: 32, y: 160 });
    });

    room1.onResume((self, sc) => {
        console.log('room1.onResume');
    });
}