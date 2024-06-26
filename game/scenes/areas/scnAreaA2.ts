import { Game } from './../../../engine/game';
import { initArea, setupAreaCommon } from './../../scripts/areaSceneSetup';

export function buildAreaA2(game: Game) {
    const area = game.construct.defineScene('scnAreaA2', { width: 640, height: 480, persistent: true });
    area.setBackground(game.construct.getSprite('sprGrass'));
    setupAreaCommon(game, area);

    area.onStart((self, controller, data) => {
        initArea(game, self, data);

        const map = [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
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
            'X       X                              X',
            '        X                              X',
            '        X                              X',
            '        X                              X',
            'X       X                              X',
            'X       X                              X',
            'X                                      X',
            'X          X                           X',
            'X                                      X',
            'X              X                       X',
            'X                                      X',
            'X                                      X',
            'X           XXXXXXXXXXXX               X',
            'X                                      X',
            'X                                      X',
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