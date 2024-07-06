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
    canvasOptions: {
        fullScreen: true
    },
    defaultSceneOptions: {
        height: 1024, 
        width: 1532, 
        persistent: true
    }
});

vastGame.construction.sounds.add('sndPlop', { source: './resources/sounds/plop.wav' });
vastGame.construction.sprites.add('sprButton', { source: './resources/pinkblue.png', height: 32, width: 32 })
vastGame.construction.sprites.add('sprLink', { source: './resources/guy_sheet.png', height: 16, width: 16 });
vastGame.construction.sprites.add('granite', { source: './resources/greenblock.png' });
vastGame.construction.sprites.add('bgAreaA1', { source: './resources/backgrounds/testWorld.png' });
vastGame.construction.sprites.add('sprCoin', { source: './resources/coin.png' });
vastGame.construction.sprites.add('sprGrass', { source: './resources/grass.png' });
vastGame.construction.sprites.add('sprSky', { source: './resources/sky.png' })

// TODO maybe just don't pass game back from the promise
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

    game.controller.onSceneChange((oldSceneState, newSceneState) => {
        console.log(`Changing from ${oldSceneState.scene.name} to ${newSceneState.scene.name}`);
    });

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});