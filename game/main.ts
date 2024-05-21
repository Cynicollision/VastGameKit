import { VastGameKit } from './../engine/vastgamekit';

import { buildWallActor } from './actors/wall';
import { buildRoom1 } from './rooms/room1';
import { buildPlayerActor } from './actors/player';
import { buildCoinActor } from './actors/coin';
import { buildDefaultRoom } from './rooms/default';

const game = VastGameKit.init({
    canvasElementId: 'gameCanvas',
    defaultSceneOptions: {
        height: 1000, 
        width: 2000, 
        persistent: true
    }
});

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
