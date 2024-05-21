import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    // HUD
    const hud = game.defaultScene.createLayer('hud1', { x: 16, y: 16, height: 128, width: game.canvas.width - 32 })
        .setBackground('#0A0')
        .onDraw((self, gc, canvas) => {
            canvas.drawText('Hello HUD ' + (gc.state.message || ''), self.x + 100, self.y + 100, { color: '#0F0', font: '32px Arial'});
        })

    const button = game.defineActor('button');
    button.sprite = game.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });
    button.onCreate((self, gc) => button.setRectBoundaryFromSprite());
    button.onPointerInput('mousedown', (self, gc, event) => {
        if (self.animation.stopped) {
            self.animation.start(0, 1, 500);
        }
        else {
            self.animation.stop();
        }
    });

    hud.onCreate((self, gc) => {
        self.createInstance('button', 16, 16);
        self.follow(self.scene.camera);
    });

    game.defaultScene.onStart((self, gc) => {
        console.log('defaultRoom.onStart');
        const player = self.defaultLayer.createInstance('actPlayer', 256, 256);
        self.camera.follow(player, { centerOnInstanceBoundary: true });

        

        const map = [
            'X                             X',
            'X                    C        X',
            'X                             X',
            'X                             X',
            'X                             X',
            'X                             X',
            'X                             X',
            'X       C                     X',
            'X                  XX         X',
            'X                 XXXX        X',
            'X                  XX         X',
            'X                             X',
            'X                             X',
            'X                             X',
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        ];

        const key = {
            'C': 'actCoin',
            'X': 'actWall'
        };

        self.defaultLayer.createInstancesFromMap(64, map, key);

        // self.defaultLayer.createInstance('wall', 0, 64 * 1);
        // self.defaultLayer.createInstance('wall', 0, 64 * 2);
        // self.defaultLayer.createInstance('wall', 0, 64 * 3);
        // self.defaultLayer.createInstance('wall', 0, 64 * 4);
        // self.defaultLayer.createInstance('wall', 0, 64 * 5);
        // self.defaultLayer.createInstance('wall', 0, 64 * 6);
    });

    game.defaultScene.defaultLayer.onGameEvent('something', (self, gc, ev) => {
        console.log('game.defaultRoom.onGameEvent.something!');
        console.log('game.defaultRoom.onGameEvent.something data = '+ev.data);
        //event.cancel();
    });

    game.defaultScene.defaultLayer.setBackground(game.defineSprite('sky', './resources/sky.png'), { opacity: 0.5});

    game.defaultScene.defaultLayer.onCreate((self, gc) => {
        console.log('defaultRoom.defaultLayer.onCreate');
    });

}