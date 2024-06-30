import { Game } from './../../engine/game';

export function buildWallActor(game: Game) {
    game.construction.defineActor('actWall', { 
        solid: true,
        sprite: game.construction.getSprite('granite'),
    }).setRectBoundaryFromSprite();
}