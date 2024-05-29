import { Game } from './../engine/game';

import { buildWallActor } from './actors/wall';
import { buildRoom1 } from './rooms/room1';
import { buildPlayerActor } from './actors/player';
import { buildCoinActor } from './actors/coin';
import { buildDefaultRoom } from './rooms/default';

const game = Game.initGame({
    canvasElementId: 'gameCanvas',
    defaultSceneOptions: {
        height: 1000, 
        width: 2000, 
        persistent: true
    }
});

// TODO: put these within "load" callback, to be called after sprites, etc. are loaded.
buildCoinActor(game);
buildPlayerActor(game);
buildWallActor(game);

buildDefaultRoom(game);
buildRoom1(game);

// load and start the game
game.load().then(() => {
    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});
