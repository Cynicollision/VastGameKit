import { Game } from './../../../engine/game';
import { initArea, setCommonAreaEvents } from './../../scripts/areaSceneSetup';

export function buildAreaA1(game: Game) {
    const area = game.construct.defineScene('scnAreaA1', { width: 640, height: 480, persistent: true });
    area.setBackground(game.construct.getSprite('sprGrass'));
    setCommonAreaEvents(area);

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