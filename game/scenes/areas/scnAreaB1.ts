import { Game } from './../../../engine/game';
import { initArea, setupAreaCommon } from './../../scripts/areaSceneSetup';

export function buildAreaB1(game: Game) {
    const area = game.construction.scenes.add('scnAreaB1', { width: 640, height: 480, persistent: true });
    area.background.setFromSprite(game.construction.sprites.get('sprGrass'));
    setupAreaCommon(game, area);

    area.onStart((self, controller, data) => {
        initArea(game, self, data);

        const map = [
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                       X              X',
            'X                       X              X',
            'X                       X              X',
            'X             XXXXXXXXXXX              X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                             XXXXXXXXXX',
            'X                                       ',
            'X                                       ',
            'X                                       ',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        ];

        const key = {
            'C': 'actCoin',
            'X': 'actWall',
            'B': 'actButton'
        };

        self.instances.createFromMap(16, map, key);
    });
}