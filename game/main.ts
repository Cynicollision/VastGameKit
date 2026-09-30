// Nine Lives: a cat crosses town to get home. The engine's demo, using most of its features.
import { Game } from './../engine';
import { buildCat } from './actors/cat';
import { buildScenery } from './actors/scenery';
import { buildTraffic } from './actors/traffic';
import { Colors, Screen } from './constants';
import { FontCellSize, FontCharacters, Sprites } from './generated/art';
import { SoundNames } from './generated/sounds';
import { buildHud } from './scenes/hud';
import { buildLevel } from './scenes/level';
import { buildPanels } from './scenes/panels';
import { buildTitle } from './scenes/title';
import { applySettings } from './settings';
import { setFont } from './text';

const game = Game.init({
    canvasElementId: 'gameCanvas',
    name: 'nineLives',
    canvasOptions: {
        backgroundColor: Colors.outline,
        width: Screen.width,
        height: Screen.height,
        scale: 'integer',
    },
});

const construction = game.construction;
construction.fonts.add('fntPixel', { source: './resources/font.png', width: FontCellSize, height: FontCellSize, characters: FontCharacters });
construction.tileMaps.add('mapLevel', { source: './resources/maps/level.tmx' });
construction.tileMaps.add('mapTitle', { source: './resources/maps/title.tmx' });

// every sound synthesized by tools/build-sfx.mjs.
for (const name of SoundNames) {
    construction.sounds.add(name, { source: `./resources/sounds/${name}.wav` });
}

// every sprite drawn by tools/build-art.mjs.
for (const [name, sprite] of Object.entries(Sprites)) {
    construction.sprites.add(name, { source: `./resources/sprites/${name}.png`, width: sprite.width, height: sprite.height });
}

game.load().then(() => {
    setFont(construction.fonts.get('fntPixel'));

    buildCat(game);
    buildScenery(game);
    buildTraffic(game);

    buildHud(game);
    buildPanels(game);
    buildLevel(game);
    buildTitle(game);

    applySettings(game.controller);
    game.defaultScene.onStart((self, controller) => controller.goToScene('scnTitle'));

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});
