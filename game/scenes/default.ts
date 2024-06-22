import { SceneEmbedDisplayMode } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildDefaultRoom(game: Game) {

    game.defaultScene.setBackground(game.construct.defineSprite('sky', './resources/sky.png'));

    // TODO: move to test/demo scenes
    const embedded = game.construct.defineScene('embedded', { width: 250, height: 250, persistent: false });
    embedded.setBackground('#00F');
    embedded.onStart((self, sc) => {
        self.instances.create('actButton', 32, 32);
        self.instances.create('actButton', 96, 32);
        self.instances.create('actButton', 196, 32);
    });

    game.defaultScene.onStart((self, controller) => {
        console.log('defaultRoom.onStart');
        
        controller.goToScene('scnAreaA1', { playerX: 32, playerY: 32 });

        self.embeds.create('embedded', { x: 200, y: 400, displayMode: SceneEmbedDisplayMode.Embed });
        self.embeds.create('hud', { x: 0, y: 0, displayMode: SceneEmbedDisplayMode.Float });

        const player = self.instances.create('actPlayer', 32, 128);

        // TODO: should be sharable between all scene states that use the same camera settings
        const scale = 4; // TODO should be game-level param
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

    game.defaultScene.onKeyboardInput('m', (self, event, sc) => {
        if (self.state.modalOpen) {
            return;
        }

        const modalX = 20;
        const modalY = 20;
        self.state.modalOpen = true;
        self.paused = true;
        sc.sceneState.embeds.create('scnModal', { x: modalX, y: modalY, displayMode: SceneEmbedDisplayMode.Float })
    });

    game.defaultScene.onKeyboardInput('e', (self, event, sc) => {
        if (!self.state.modalOpen) {
            return;
        }
         sc.sceneState.embeds.destroy('scnModal');
         self.paused = false
         self.state.modalOpen = false;
    });
}