import { Game } from './../../engine/game';

export function buildWallActor(game: Game) {
    game.resources.defineActor('actWall', { 
        solid: true,
        sprite: game.resources.defineSprite('granite', './resources/greenblock.png')
    })
    .onLoad(wall => {
        wall.setRectBoundaryFromSprite();
    });
}