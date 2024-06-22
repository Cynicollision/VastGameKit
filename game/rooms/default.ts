import { SceneEmbedDisplayMode } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    game.defaultScene.setBackground(game.construct.defineSprite('sky', './resources/sky.png'));

    const button = game.construct.defineActor('actButton');
    button.sprite = game.construct.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });

    button.onCreate((self, sc) => {
        button.setRectBoundaryFromSprite();
    });

    button.onPointerInput('mousedown', (self, gc, event) => {
        if (self.animation.stopped) {
            self.animation.start(0, 1, 100);
        }
        else {
            self.animation.stop();
        }
    });

    button.onKeyboardInput('t', ((self, event, sc) => {
        self.destroy();
    }));

    button.onGameEvent('startAll', (self, event, sc) => {
        self.animation.start(0, 1, event.data.speed);
    });

    button.onGameEvent('endAll', (self, event, sc) => {
        self.animation.stop();
    });

    const embedded = game.construct.defineScene('embedded', { width: 250, height: 250, persistent: false });
    embedded.setBackground('#00F');
    embedded.onStart((self, sc) => {
        self.instances.create('actButton', 32, 32);
        self.instances.create('actButton', 96, 32);
        self.instances.create('actButton', 196, 32);
    });

    game.defaultScene.onStart((self, sc) => {
        console.log('defaultRoom.onStart');

        self.embeds.create('embedded', { x: 200, y: 400, displayMode: SceneEmbedDisplayMode.Embed });
        self.embeds.create('hud', { x: 0, y: 0, displayMode: SceneEmbedDisplayMode.Float });

        const player = self.instances.create('actPlayer', 32, 128);

        // const follower1 = self.instances.create('actButton');
        // follower1.follow(player, { offsetX: 16, offsetY: 16 });

        const follower2 = self.instances.create('actButton', 0, 0);
        follower2.follow(self.defaultCamera, { offsetX: 19, offsetY: 19 });
        follower2.depth = -100;

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
            'XXXXXXXXXXXXXXXXXXXXXXXX',
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
    })

    game.defaultScene.onGameEvent('something', (self, ev, sc) => {
        console.log('game.defaultScene.onGameEvent.something!');
        console.log('game.defaultScene.onGameEvent.something data = '+ev.data);
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