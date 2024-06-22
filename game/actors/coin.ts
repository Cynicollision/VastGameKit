import { SpriteTransformation } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildCoinActor(game: Game) {
    const actCoin = game.construct.defineActor('actCoin', { 
        solid: false,
        sprite: game.construct.getSprite('sprCoin'),
    });

    actCoin.setCircleBoundaryFromSprite();

    actCoin.onCreate((self, sc) => {
        self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
    });
}