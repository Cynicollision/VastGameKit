import { SpriteTransformation } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildCoinActor(game: Game) {
    const actCoin = game.construction.actors.add('actCoin', { 
        solid: false,
        sprite: game.construction.sprites.get('sprCoin'),
    });

    actCoin.setCircleBoundaryFromSprite();

    actCoin.onCreate((self, sc) => {
        self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
    });
}