import { Game } from './../engine/game';

import { buildWallActor } from './actors/wall';
import { buildPlayerActor } from './actors/player';
import { buildCoinActor } from './actors/coin';
import { buildDefaultScene } from './scenes/default';
import { buildHUD } from './scenes/interface/hud';
import { buildModal } from './scenes/interface/modal';
import { buildAreaA1 } from './scenes/areas/scnAreaA1';
import { buildAreaA2 } from './scenes/areas/scnAreaA2';
import { buildAreaB1 } from './scenes/areas/scnAreaB1';
import { buildAreaB2 } from './scenes/areas/scnAreaB2';
import { buildDummyButton } from './actors/dummyButton';

const vastGame = Game.init({
    canvasElementId: 'gameCanvas',
    targetFPS: 60,
    defaultSceneOptions: {
        height: 1024, 
        width: 1532, 
        persistent: true
    }
});

vastGame.construction.defineSprite('sprLink', './resources/guy_sheet.png', { height: 16, width: 16 });
vastGame.construction.defineSprite('granite', './resources/greenblock.png');
vastGame.construction.defineSprite('sprCoin', './resources/coin.png');
vastGame.construction.defineSprite('sprGrass', './resources/grass.png');
vastGame.construction.defineSprite('sprSky', './resources/sky.png')

vastGame.load().then(game => {
    buildCoinActor(game);
    buildDummyButton(game);
    buildPlayerActor(game);
    buildWallActor(game);
    
    buildHUD(game);
    buildModal(game);

    buildDefaultScene(game);
    buildAreaA1(game);
    buildAreaA2(game);
    buildAreaB1(game);
    buildAreaB2(game);

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});