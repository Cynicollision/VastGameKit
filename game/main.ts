// A demo of the engine's features, and a quick way to check they still work together. See the HUD for controls.
import { Game } from './../engine';

import { buildCoinActor } from './actors/coin';
import { buildDummyButton } from './actors/dummyButton';
import { buildPlayerActor } from './actors/player';
import { buildWallActor } from './actors/wall';
import { buildAreas } from './scenes/areas';
import { buildDefaultScene } from './scenes/default';
import { buildHUD } from './scenes/interface/hud';
import { buildModal } from './scenes/interface/modal';

const vastGame = Game.init({
    canvasElementId: 'gameCanvas',
    name: 'vastgameDemo',
    targetFPS: 60,
    canvasOptions: {
        scale: 'integer'
    },
    defaultSceneOptions: {
        height: 1024,
        width: 1532,
        persistent: true
    }
});

vastGame.construction.sounds.add('sndPlop', { source: './resources/sounds/plop.wav' });
vastGame.construction.sprites.add('sprButton', { source: './resources/pinkblue.png', height: 32, width: 32 });
vastGame.construction.sprites.add('sprLink', { source: './resources/guy_sheet.png', height: 16, width: 16 });
vastGame.construction.sprites.add('granite', { source: './resources/greenblock.png' });
vastGame.construction.sprites.add('bgAreaA1', { source: './resources/backgrounds/testWorld.png' });
vastGame.construction.sprites.add('sprCoin', { source: './resources/coin.png' });
vastGame.construction.sprites.add('sprGrass', { source: './resources/grass.png' });
vastGame.construction.sprites.add('sprSky', { source: './resources/sky.png' });

vastGame.load().then(game => {
    buildCoinActor(game);
    buildDummyButton(game);
    buildPlayerActor(game);
    buildWallActor(game);

    buildHUD(game);
    buildModal(game);

    buildDefaultScene(game);
    buildAreas(game);

    game.controller.onSceneChange((oldSceneState, newSceneState) => {
        console.log(`Changing from ${oldSceneState.scene.name} to ${newSceneState.scene.name}`);
    });

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});
