import { Game } from './../engine/game';
import { GameScene } from './../engine/structure/scene';
import { SubScene } from './../engine/state/subScene';
import { SceneSubSceneState } from './../engine/state/subSceneState';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestUtil } from './testUtil';

describe('SceneSubSceneState', () => {
    let testGame: Game;
    let testSubSceneState: SceneSubSceneState;

    function getSubScenes(): SubScene[] {
        const subScenes: SubScene[] = [];
        testSubSceneState.forEach(subScene => subScenes.push(subScene));
        return subScenes;
    }

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.controller.sceneState.startOrResume(testGame.controller);
        testSubSceneState = new SceneSubSceneState(testGame.controller);

        testGame.construction.scenes.add('scnSub1', { width: 300, height: 200 });
        testGame.construction.scenes.add('scnSub2', { width: 300, height: 200 });
        testGame.construction.scenes.add('scnSub3', { width: 300, height: 200 });
    });

    it('creates SubScenes', () => {
        testSubSceneState.create('scnSub1');
        const subScenes = getSubScenes();

        expect(subScenes.length).toBe(1);
        expect(subScenes[0].sceneState.scene.name).toBe('scnSub1');
        expect(subScenes[0].sceneState.scene.height).toBe(200);
        expect(subScenes[0].sceneState.scene.width).toBe(300);
    });

    it('deletes destroyed SubScenes during step', () => {
        const subScene = testSubSceneState.create('scnSub1');
        let subScenes = getSubScenes();

        expect(subScenes.length).toBe(1);
        expect(subScenes[0].sceneState.scene.name).toBe('scnSub1');
        expect(subScenes[0].sceneState.scene.height).toBe(200);
        expect(subScenes[0].sceneState.scene.width).toBe(300);

        subScene.destroy();
        testSubSceneState.step(testGame.controller);
        subScenes = getSubScenes();

        expect(subScenes.length).toBe(0);
    });

    it('draws SubScenes by depth', () => {
        const drawOrder: string[] = [];
        testGame.construction.scenes.get('scnSub1').onDraw(self => drawOrder.push(self.scene.name));
        testGame.construction.scenes.get('scnSub2').onDraw(self => drawOrder.push(self.scene.name));
        testGame.construction.scenes.get('scnSub3').onDraw(self => drawOrder.push(self.scene.name));

        testSubSceneState.create('scnSub2', { depth: 10 });
        testSubSceneState.create('scnSub1', { depth: -20 });
        testSubSceneState.create('scnSub3', { depth: 0 });

        const mockCanvas = <MockGameCanvas>testGame.canvas;
        expect(mockCanvas.drawnImages.length).toBe(0);

        testSubSceneState.draw(mockCanvas, testGame.controller);

        expect(mockCanvas.drawnImages.length).toBe(3);
        expect(drawOrder.length).toBe(3);
        expect(drawOrder[0]).toBe('scnSub2');
        expect(drawOrder[1]).toBe('scnSub3');
        expect(drawOrder[2]).toBe('scnSub1');
    });
    
    it('enumerates a callback over its SubScenes', () => {
        testSubSceneState.create('scnSub1', { x: 10, y: 20 });
        testSubSceneState.create('scnSub1', { x: 10, y: 20 });

        testSubSceneState.forEach(embed => embed.sceneState.state.foo = 'bar');
        testSubSceneState.forEach(embed => expect(embed.sceneState.scene).toBe(<GameScene>testGame.construction.scenes.get('scnSub1')));
        testSubSceneState.forEach(embed => expect(embed.sceneState.state.foo).toBe('bar'));
    });
});