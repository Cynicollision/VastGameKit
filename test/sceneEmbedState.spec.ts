import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { SceneSubSceneState } from './../engine/scene/sceneSubSceneState';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestUtil } from './testUtil';

describe('SceneEmbedState', () => {
    let testGame: Game;
    let testEmbedState: SceneSubSceneState;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.controller.sceneState.startOrResume(testGame.controller);
        testEmbedState = new SceneSubSceneState(testGame.controller);

        testGame.construct.defineScene('scnSub1', { width: 300, height: 200 });
        testGame.construct.defineScene('scnSub2', { width: 300, height: 200 });
        testGame.construct.defineScene('scnSub3', { width: 300, height: 200 });
    });

    it('creates SubScenes', () => {
        testEmbedState.create('scnSub1');
        const subScenes = testEmbedState.toList();

        expect(subScenes.length).toBe(1);
        expect(subScenes[0].sceneState.scene.name).toBe('scnSub1');
        expect(subScenes[0].sceneState.scene.height).toBe(200);
        expect(subScenes[0].sceneState.scene.width).toBe(300);
    });

    it('deletes destroyed SubScenes during step', () => {
        const subScene = testEmbedState.create('scnSub1');
        let subScenes = testEmbedState.toList();

        expect(subScenes.length).toBe(1);
        expect(subScenes[0].sceneState.scene.name).toBe('scnSub1');
        expect(subScenes[0].sceneState.scene.height).toBe(200);
        expect(subScenes[0].sceneState.scene.width).toBe(300);

        subScene.destroy();
        testEmbedState.step(testGame.controller);
        subScenes = testEmbedState.toList();

        expect(subScenes.length).toBe(0);
    });

    it('draws SubScenes by depth', () => {
        const drawOrder = [];
        testGame.construct.getScene('scnSub1').onDraw(self => drawOrder.push(self.scene.name));
        testGame.construct.getScene('scnSub2').onDraw(self => drawOrder.push(self.scene.name));
        testGame.construct.getScene('scnSub3').onDraw(self => drawOrder.push(self.scene.name));

        testEmbedState.create('scnSub2', { depth: 10 });
        testEmbedState.create('scnSub1', { depth: -20 });
        testEmbedState.create('scnSub3', { depth: 0 });

        const mockCanvas = <MockGameCanvas>testGame.canvas;
        expect(mockCanvas.drawnImages.length).toBe(0);

        testEmbedState.draw(mockCanvas, mockCanvas, testGame.controller);

        expect(mockCanvas.drawnImages.length).toBe(3);
        expect(drawOrder.length).toBe(3);
        expect(drawOrder[0]).toBe('scnSub2');
        expect(drawOrder[1]).toBe('scnSub3');
        expect(drawOrder[2]).toBe('scnSub1');
    });
    
    it('enumerates a callback over its ActorInstances', () => {
        testEmbedState.create('scnSub1', { x: 10, y: 20 });
        testEmbedState.create('scnSub1', { x: 10, y: 20 });

        testEmbedState.forEach(embed => embed.sceneState.state.foo = 'bar');
        testEmbedState.forEach(embed => expect(embed.sceneState.scene).toBe(<GameScene>testGame.construct.getScene('scnSub1')));
        testEmbedState.forEach(embed => expect(embed.sceneState.state.foo).toBe('bar'));
    });
});