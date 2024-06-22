import { Game } from './../../engine/game';

export function buildWallActor(game: Game) {
    game.construct.defineActor('actWall', { 
        solid: true,
        sprite: game.construct.getSprite('granite'),
    }).setRectBoundaryFromSprite();
}