import { SubSceneDisplayMode } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    game.defaultScene.setBackground(game.defineSprite('sky', './resources/sky.png'));

    const button = game.defineActor('actButton');
    button.sprite = game.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });

    
    button.onCreate((self, sc) => {
        button.setRectBoundaryFromSprite();
    })
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
        self.createInstance('actButton', 32, 32);
        self.createInstance('actButton', 96, 32);
    });

    const embedded = game.defineScene('embedded', { width: 250, height: 250, persistent: false });
    embedded.setBackground('#00F');
    embedded.onStart((self, sc) => {
        self.createInstance('actButton', 32, 32);
        self.createInstance('actButton', 96, 32);
        self.createInstance('actButton', 196, 32);
    });


    const scene = game.defaultScene;
    scene.onStart((self, sc) => {
            console.log('defaultRoom.onStart');

            game.defaultScene.showSubScene('embedded', sc, { x: 200, y: 400, displayMode: SubSceneDisplayMode.Embed });
            game.defaultScene.showSubScene('hud', sc, { x: 0, y: 0, displayMode: SubSceneDisplayMode.Float });

            const player = self.createInstance('actPlayer', 256, 256);

            self.defaultCamera.follow(player, { centerOnInstanceBoundary: true });
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

    scene.onGameEvent('something', (self, ev, sc) => {
        console.log('game.defaultScene.onGameEvent.something!');
        console.log('game.defaultScene.onGameEvent.something data = '+ev.data);
    });
    scene.onKeyboardInput('y', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 250 });
    });
    scene.onKeyboardInput('u', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 500 });
    });
    scene.onKeyboardInput('i', (self, event, sc) => {
        sc.publishEvent('endAll');
    });

}