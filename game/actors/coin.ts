import { Game } from './../../engine/game';

export function buildCoinActor(game: Game) {
    game.defineActor('actCoin', { 
        solid: true,
        sprite: game.defineSprite('sprCoin', './resources/coin.png') 
    })
    .onLoad(coin => {
        coin.setCircleBoundaryFromSprite();
    });
}