import { Game } from './../../engine/game';

export function buildDefaultScene(game: Game) {

    game.defaultScene.setBackground(game.construct.defineSprite('sky', './resources/sky.png'));

    // TODO: move to test/demo scenes
    const embedded = game.construct.defineScene('scnEmbedTest', { width: 250, height: 250, persistent: false });
    embedded.setBackground('#00F');
    embedded.onStart((self, sc) => {
        self.instances.create('actButton', { x: 32, y: 32 });
        self.instances.create('actButton', { x: 96, y: 32 });
        self.instances.create('actButton', { x: 196, y: 32 });
    });

    game.defaultScene.onStart((self, controller) => {
        console.log('defaultRoom.onStart');

        self.embedSubScene('scnEmbedTest', { x: 200, y: 400 });
        self.floatSubScene('scnHUD', { x: 0, y: 0 });

        const player = self.instances.create('actPlayer', { x: 32, y: 128 });

        const scale = 4;
        self.defaultCamera.height = (960 - 120) / scale;
        self.defaultCamera.width = 1280 / scale;
        self.defaultCamera.portWidth = self.defaultCamera.width * scale;
        self.defaultCamera.portHeight = self.defaultCamera.height * scale;
        self.defaultCamera.portY = 120;
        self.defaultCamera.follow(player, { centerOnTarget: true });

        self.addCamera('minimap', { x: 0, y: 0, portX: 1000, portY: 140, width: 1024, height: 1024, portWidth: 200, portHeight: 200 });

        const map = [
            'XXXXXXXXXXXXXXXXXXXXXXXX',
            'X X                  C X',
            'X X                    X',
            'X    P     C           X',
            'X                      X',
            'X                      X',
            'X             B        X',
            'X                      X',
            'X                  XX  X',
            'X                 XXXX X',
            'X                  XX  X',
            'X XXXXX                X',
            'X X X X         XXXXX  X',
            'X X                    X',
            'X                      X',
            'XXXXXXXX   XXXXXXXXXXXXX',
        ];

        const key = {
            'C': 'actCoin',
            'X': 'actWall',
            'B': 'actButton'
        };

        self.instances.createFromMap(16, map, key);
    });

    game.defaultScene.onResume((self, sc) => {
        console.log('defaultRoom.onResume');
    });

    game.defaultScene.onKeyboardInput('q', (self, event, controller) => {
        controller.publishEvent('goToGame', { sceneName: 'scnAreaA1' });
    });

    game.defaultScene.onGameEvent('goToGame', (self, ev, controller) => {
        console.log('game.defaultScene.onGameEvent.goToGame');
        controller.goToScene(ev.data.sceneName, { playerX: 32, playerY: 32 });
    });

    game.defaultScene.onKeyboardInput('y', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 250 });
    });

    game.defaultScene.onKeyboardInput('u', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 500 });
    });

    game.defaultScene.onKeyboardInput('i', (self, event, sc) => {
        sc.publishEvent('endAll');
    });
}