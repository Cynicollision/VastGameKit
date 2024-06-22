import { SceneEmbedDisplayMode } from '../../engine/core';
import { Game } from './../../engine/game';
import { SceneState } from '../../engine/scene/sceneState';
import { Scene } from '../../engine/scene';
import Constants from './../constants';

export function initArea(game: Game, areaState: SceneState, data: any): void {
    const player = areaState.instances.create('actPlayer', data.playerX, data.playerY);
    const hud = areaState.embeds.create('hud', { x: 0, y: 0, displayMode: SceneEmbedDisplayMode.Float });

    const scale = 4; // TODO should be game-level param and passed to floating embeds
    areaState.defaultCamera.height = (game.canvas.height - Constants.HUDHeight) / scale;
    areaState.defaultCamera.width = game.canvas.width / scale;
    areaState.defaultCamera.portWidth = areaState.defaultCamera.width * scale;
    areaState.defaultCamera.portHeight = areaState.defaultCamera.height * scale;
    areaState.defaultCamera.portY = Constants.HUDHeight;
    areaState.defaultCamera.follow(player, { centerOnTarget: true });
}

export function setCommonAreaEvents(areaScene: Scene): void {

    areaScene.onResume((self, controller, data) => {
        self.instances.getAll('actPlayer').forEach(player => {
            player.x = data.playerX;
            player.y = data.playerY;
        });
    });

    areaScene.onKeyboardInput('m', (self, event, sc) => {
        if (self.state.modalOpen) {
            return;
        }

        const modalX = 40;
        const modalY = 80;
        self.state.modalOpen = true;
        self.paused = true;
        sc.sceneState.embeds.create('scnModal', { x: modalX, y: modalY, depth: -100, displayMode: SceneEmbedDisplayMode.Float })
    });

    areaScene.onKeyboardInput('e', (self, event, sc) => {
        if (!self.state.modalOpen) {
            return;
        }
         sc.sceneState.embeds.destroy('scnModal');
         self.paused = false
         self.state.modalOpen = false;
    });

    areaScene.onKeyboardInput('y', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 250 });
    });

    areaScene.onKeyboardInput('u', (self, event, sc) => {
        sc.publishEvent('startAll', { speed: 500 });
    });

    areaScene.onKeyboardInput('i', (self, event, sc) => {
        sc.publishEvent('endAll');
    });
}