import { Game } from './../../engine/game';
import { Scene } from './../../engine/scene';
import { SceneState } from './../../engine/scene/sceneState';
import Constants from './../constants';

export function initArea(game: Game, areaState: SceneState, data: any): void {
    const player = areaState.instances.create('actPlayer', { x: data.playerX, y: data.playerY });
    const hud = areaState.floatSubScene('scnHUD', { x: 0, y: 0, width: game.canvas.width });

    const scale = 4; // TODO should be game-level param and available when setting up floating sub scenes
    areaState.defaultCamera.height = (game.canvas.height - Constants.HUDHeight) / scale;
    areaState.defaultCamera.width = game.canvas.width / scale;
    areaState.defaultCamera.portWidth = areaState.defaultCamera.width * scale;
    areaState.defaultCamera.portHeight = areaState.defaultCamera.height * scale;
    areaState.defaultCamera.portY = Constants.HUDHeight;
    areaState.defaultCamera.follow(player, { centerOnTarget: true });
}

export function setupAreaCommon(game: Game, areaScene: Scene): void {

    areaScene.onResume((self, controller, data) => {
        self.instances.getAll('actPlayer').forEach(player => {
            player.x = data.playerX;
            player.y = data.playerY;
        });
    });

    areaScene.onKeyboardInput('m', (self, event, controller) => {
        if (self.state.openModal) {
            return;
        }

        const modalHeight = 640;
        const modalWidth = 960;

        const modalConfig = {
            depth: -100, 
            height: modalHeight,
            width: modalWidth,
            x: (game.canvas.width - modalWidth) / 2, 
            y: (game.canvas.height - modalHeight) / 2, 
        };
        
        const modal = controller.sceneState.floatSubScene('scnModal', modalConfig);
        self.state.openModal = modal;
        self.paused = true;
        controller.state.hud.paused = true;
    });

    areaScene.onKeyboardInput('e', (self, event, controller) => {
         if (!self.state.openModal) {
            return;
         }

        self.state.openModal.destroy();
        self.state.openModal = null;
        self.paused = false;
        controller.state.hud.paused = false;
    });

    areaScene.onKeyboardInput('y', (self, event, controller) => {
        controller.publishEvent('startAll', { speed: 250 });
    });

    areaScene.onKeyboardInput('u', (self, event, controller) => {
        controller.publishEvent('startAll', { speed: 500 });
    });

    areaScene.onKeyboardInput('i', (self, event, controller) => {
        controller.publishEvent('endAll');
    });
}