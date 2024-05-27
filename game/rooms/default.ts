import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    // HUD
    // const hud = game.defaultScene.defineLayer('hud1', { x: 16, y: 16, height: 128, width: game.canvas.width - 32 })
    //     .setBackground('#0A0')
    //     .onDraw((self, canvas, sc) => {
    //         canvas.drawText('Hello HUD ' + (sc.state.message || ''), self.x + 100, self.y + 100, { color: '#0F0', font: '32px Arial'});
    //     })

    const button = game.defineActor('actButton');
    button.sprite = game.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });

    button.onCreate((self, sc) => {
        button.setRectBoundaryFromSprite();
    });
    
    button.onPointerInput('mousedown', (self, gc, event) => {
        if (self.animation.stopped) {
            self.animation.start(0, 1, 500);
        }
        else {
            self.animation.stop();
        }
    });

    // hud.onCreate((self, sc) => {
    //     self.createInstance('button', 16, 16);
    //     self.follow(self.scene.defaultCamera);
    // });

    game.defaultScene.setBackground(game.defineSprite('sky', './resources/sky.png'));

    game.defaultScene.onStart((self, sc) => {
        console.log('defaultRoom.onStart');
        const player = self.createInstance('actPlayer', 256, 256);
        self.defaultCamera.follow(player, { centerOnInstanceBoundary: true });
        self.defaultCamera.portY = 120;

        self.defineCamera('hud', { x: 0, y: 980, portX: 0, portY: 0, width: self.game.canvas.width, height: 120, portWidth: self.game.canvas.width, portHeight: 120 });

        self.defineCamera('camera2', { x: 400, y: -200, portX: 500, portY: 0, width: 400, height: 800, portWidth: 200, portHeight: 400 });

        const map = [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'X                    C        X',
            'X                             X',
            'X          C                  X',
            'X                             X',
            'X                             X',
            'X                             X',
            'X                             X',
            'X                  XX         X',
            'X  B              XXXX        X',
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
        //event.cancel();
    });

    


}