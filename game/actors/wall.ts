import { Game } from './../../engine';

export function buildWallActor(game: Game) {
    game.construction.actors.add('actWall', { 
        solid: true,
        sprite: game.construction.sprites.get('granite'),
    }).setRectBoundaryFromSprite();
}