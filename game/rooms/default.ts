import { SceneEmbedDisplayMode } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    game.defaultScene.setBackground(game.defineSprite('sky', './resources/sky.png'));

    const button = game.defineActor('actButton');
    button.sprite = game.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });

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

    const hud = game.defineScene('hud', { width: game.canvas.width, height: 120, persistent: false });
    hud.setBackground('#0F0');
    hud.onStart((self, sc) => {
        self.createInstance('actButton', { x: 32, y: 32 });
        self.createInstance('actButton', { x: 96, y: 32 });
    });

    const embedded = game.defineScene('embedded', { width: 250, height: 250, persistent: false });
    embedded.setBackground('#00F');
    embedded.onStart((self, sc) => {
        self.createInstance('actButton', { x: 32, y: 32 });
        self.createInstance('actButton', { x: 96, y: 32 });
        self.createInstance('actButton', { x: 196, y: 32 });
    });

    game.defaultScene.createSceneEmbed('embedded', { x: 200, y: 400, displayMode: SceneEmbedDisplayMode.Embed });
    game.defaultScene.createSceneEmbed('hud', { x: 0, y: 0, displayMode: SceneEmbedDisplayMode.Float });

    game.defaultScene.onStart((self, sc) => {
        console.log('defaultRoom.onStart');

        const player = self.createInstance('actPlayer', { x: 256, y: 256 });

        const follower1 = self.createInstance('actButton');
        follower1.follow(player, { offsetX: 16, offsetY: 16 });

        const follower2 = self.createInstance('actButton');
        follower2.follow(self.defaultCamera, { offsetX: 16, offsetY: 16 });
        follower2.depth = -100;

        self.defaultCamera.follow(player, { centerOnTarget: true });
        self.defaultCamera.portY = 120;

        self.defineCamera('minimap', { x: 0, y: 0, portX: 800, portY: 140, width: 1024, height: 1024, portWidth: 200, portHeight: 200 });

        const map = [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'X X                  C        X',
            'X X                           X',
            'X          C                  X',
            'X                             X',
            'X                             X',
            'X             B           B   X',
            'X                             X',
            'X                  XX         X',
            'X                 XXXX        X',
            'X                  XX         X',
            'X XXXXX                       X',
            'X X X X         XXXXX         X',
            'X X                           X',
            'XXXXXXXXXX  XXXXXXXXXXXXXXXXXXX',
        ];

        const key = {
            'C': 'actCoin',
            'X': 'actWall',
            'B': 'actButton',
        };

        self.createInstancesFromMap(64, map, key);
    });

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