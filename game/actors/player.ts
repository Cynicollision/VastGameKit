import { Game } from './../../engine';
import { exitAreaAtEdge } from './../scenes/areas';

export function buildPlayerActor(game: Game) {
    const actPlayer = game.construction.actors.add('actPlayer', {
        sprite: game.construction.sprites.get('sprLink'),
    });

    actPlayer.setRectBoundaryFromSprite();

    actPlayer.onCreate((self, controller) => {
        self.depth = -20;
        self.state.coins = 0;
    });

    actPlayer.onCollision('actCoin', (self, other, controller) => {
        other.destroy();
        self.state.coins++;

        const best = controller.storage.get('bestCoins', 0);
        if (self.state.coins > best) {
            controller.storage.set('bestCoins', self.state.coins);
        }
    });

    actPlayer.onPointerInput('pointerdown', (self, event, controller) => {
        console.log('you clicked me');
    });

    actPlayer.onStep((self, controller) => {
        const keyboard = controller.keyboard;
        const dx = (keyboard.isDown('d') || keyboard.isDown('ArrowRight') ? 1 : 0) - (keyboard.isDown('a') || keyboard.isDown('ArrowLeft') ? 1 : 0);
        const dy = (keyboard.isDown('s') || keyboard.isDown('ArrowDown') ? 1 : 0) - (keyboard.isDown('w') || keyboard.isDown('ArrowUp') ? 1 : 0);

        if (dx !== 0) {
            self.animation.flipX = dx < 0;
        }

        self.motion.speed = dx !== 0 || dy !== 0 ? 1 : 0;
        if (self.motion.speed > 0) {
            self.motion.direction = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        }

        exitAreaAtEdge(self, controller);
    });

    actPlayer.onDraw((self, canvas, controller) => {
        canvas.drawText(`(${self.x},${self.y})`, self.x + 32, self.y + 10);
    });
}
