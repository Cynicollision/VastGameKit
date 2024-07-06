import { Game } from './../../../engine/game';
import { initArea, setupAreaCommon } from './../../scripts/areaSceneSetup';

export function buildAreaA1(game: Game) {
    const area = game.construction.scenes.add('scnAreaA1', { width: 960, height: 640, persistent: true });
    area.background.setFromSprite(game.construction.sprites.get('bgAreaA1'));
    setupAreaCommon(game, area);

    area.onStart((self, controller, data) => {
        initArea(game, self, data);

        const map = [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X    XXXXX                             X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X               X         X            X',
            'X                         X            X',
            'X                                      X',
            'X                                       ',
            'X          X                            ',
            'X                                       ',
            'X                                      X',
            'X                                      X',
            'X                   X                  X',
            'X                                      X',
            'X                                      X',
            'X           XX                  X      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                       X              X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX'
        ];

        const key = {
            'C': 'actCoin',
            'X': 'actWall',
            'B': 'actButton'
        };

        self.instances.createFromMap(16, map, key);
    });
}