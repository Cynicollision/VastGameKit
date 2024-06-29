import { Game } from './../../../engine/game';

export function buildModal(game: Game): void {
    const modal = game.construct.defineScene('scnModal', { width: 240, height: 160 });
    modal.setBackground('#CC0');

    modal.onStart((self, controller, data) => {
        console.log('modal onStart');

        self.defaultCamera.width = 240;
        self.defaultCamera.height = 160;
        self.defaultCamera.portWidth = 960;
        self.defaultCamera.portHeight = 640;

        self.instances.create('actButton', { x: 4, y: 4 });
    });

    modal.onKeyboardInput('u', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 500 });
    });
}