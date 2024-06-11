import { Game } from './../engine/game';

import { buildWallActor } from './actors/wall';
import { buildRoom1 } from './rooms/room1';
import { buildPlayerActor } from './actors/player';
import { buildCoinActor } from './actors/coin';
import { buildDefaultRoom } from './rooms/default';
import { buildHUD } from './rooms/hud';

const vastGame = Game.init({
    canvasElementId: 'gameCanvas',
    targetFPS: 60,
    defaultSceneOptions: {
        height: 1024, 
        width: 1532, 
        persistent: true
    }
});

vastGame.resources.defineSprite('sprLink', './resources/guy_sheet.png', { height: 16, width: 16 });
vastGame.resources.defineSprite('granite', './resources/greenblock.png');
vastGame.resources.defineSprite('sprCoin', './resources/coin.png');

vastGame.load().then(game => {
    buildCoinActor(game);
    buildPlayerActor(game);
    buildWallActor(game);
    buildHUD(game);

    buildDefaultRoom(game);
    buildRoom1(game);

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});