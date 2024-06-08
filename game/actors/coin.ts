import { SpriteTransformation } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildCoinActor(game: Game) {
    const actCoin = game.resources.defineActor('actCoin', { 
        solid: false,
        sprite: game.resources.defineSprite('sprCoin', './resources/coin.png') 
    });

    actCoin.onLoad(coin => {
        coin.setCircleBoundaryFromSprite();
    });
    
    actCoin.onCreate((self, sc) => {
        self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
    })
}