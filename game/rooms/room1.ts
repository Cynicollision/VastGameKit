import { SpriteTransformation } from './../../engine/sprite/sprite';
import { Game } from './../../engine/game';

export function buildRoom1(game: Game) {
    const room1 = game.defineRoom('room1', { persistent: false });
    room1.defaultLayer.setBackground('#C00');
    const hud2 = room1.createLayer('hud2', { height: 64, width: 800, x: 16, y: 16 })
        .setBackground(game.getSprite('sky'))
        .onDraw((self, state, canvas) => {
            canvas.drawText("Hello HUD2", self.x + 100, self.y + 32);
        })

    room1.onStart((self, state) => {
        console.log('room1.onStart');
        const one = self.defaultLayer.createInstance('actPlayer', 32, 96);
        one.animation.setTransform(SpriteTransformation.Opacity, 0.5);
    })
    .onResume((self, state) => {
        console.log('room1.onResume');
    });

    room1.defaultLayer.onCreate((self, state) => {
        console.log('room1.defaultLayer.onCreate');

        hud2.createInstance('actPlayer', 32, 32);
    });
}