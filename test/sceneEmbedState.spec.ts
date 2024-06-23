import { SceneEmbedDisplayMode } from './../engine/core';
import { Game } from './../engine/game';
import { GameScene } from './../engine/scene';
import { SceneEmbedState } from './../engine/scene/embedState';
import { TestUtil } from './testUtil';

describe('SceneEmbedState', () => {
    let testGame: Game;
    let testEmbedState: SceneEmbedState;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.controller.sceneState.startOrResume(testGame.controller);
        testEmbedState = new SceneEmbedState(testGame.controller, testGame.controller.sceneState);

        testGame.construct.defineScene('scnEmbed', { width: 300, height: 200 });
    });

    it('creates SceneEmbeds', () => {
        testEmbedState.create('scnEmbed');
        const embeds = testEmbedState.getAll();

        expect(embeds.length).toBe(1);
        expect(embeds[0].sceneState.scene.name).toBe('scnEmbed');
        expect(embeds[0].sceneState.scene.height).toBe(200);
        expect(embeds[0].sceneState.scene.width).toBe(300);
    });

    it('destroys SceneEmbeds by Scene name', () => {
        const embed = testEmbedState.create('scnEmbed');
        let embeds = testEmbedState.getAll();

        expect(embeds.length).toBe(1);
        expect(embeds[0].sceneState.scene.name).toBe('scnEmbed');
        expect(embeds[0].sceneState.scene.height).toBe(200);
        expect(embeds[0].sceneState.scene.width).toBe(300);

        embed.destroy();
        testEmbedState.step(testGame.controller);
        embeds = testEmbedState.getAll();

        expect(embeds.length).toBe(0);
    });

    it('draws SceneEmbeds by depth')
    
    it('enumerates a callback over its ActorInstances', () => {
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });

        testEmbedState.forEach(embed => embed.sceneState.state.foo = 'bar');
        testEmbedState.forEach(embed => expect(embed.sceneState.scene).toBe(<GameScene>testGame.construct.getScene('scnEmbed')));
        testEmbedState.forEach(embed => expect(embed.sceneState.state.foo).toBe('bar'));
    });

    it('gets all SceneEmbeds of a given display mode', () => {
        testGame.construct.defineScene('scnEmbed2');

        testEmbedState.create('scnEmbed', { displayMode: SceneEmbedDisplayMode.Embed });
        testEmbedState.create('scnEmbed', { displayMode: SceneEmbedDisplayMode.Embed });
        testEmbedState.create('scnEmbed', { displayMode: SceneEmbedDisplayMode.Float });
        testEmbedState.create('scnEmbed2', { displayMode: SceneEmbedDisplayMode.Embed });
        testEmbedState.create('scnEmbed2', { displayMode: SceneEmbedDisplayMode.Float });

        expect(testEmbedState.getAll().length).toBe(5);
        expect(testEmbedState.getAll(SceneEmbedDisplayMode.Embed).length).toBe(3);
        expect(testEmbedState.getAll(SceneEmbedDisplayMode.Float).length).toBe(2);
    });
});