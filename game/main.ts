// Nine Lives: a cat crosses town to get home. The engine's demo, using most of its features.
import { Game } from './../engine';
import { buildCat } from './actors/cat';
import { buildScenery } from './actors/scenery';
import { buildTraffic } from './actors/traffic';
import { Colors, Screen } from './constants';
import { FontCellSize, FontCharacters, Sprites } from './generated/art';
import { buildHud } from './scenes/hud';
import { buildLevel } from './scenes/level';
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
    buildLevel(game);

    game.defaultScene.onStart((self, controller) => controller.goToScene('scnLevel'));

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});
