import { Game } from './../../engine/game/game';

export function buildWallActor(game: Game) {
    game.defineActor('actWall', { 
        solid: true,
        sprite: game.defineSprite('granite', './resources/granite.png')
    })
    .onLoad(wall => {
        wall.setRectBoundaryFromSprite();
    });
}