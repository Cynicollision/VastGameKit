import { SceneEmbedDisplayMode } from '../engine/core';
import { Game } from './../engine/game';
import { GameResources } from './../engine/resources';
import { GameScene } from './../engine/scene';
import { SceneEmbedState } from './../engine/scene/embedState';
import { TestUtil } from './testUtil';

describe('SceneEmbedState', () => {
    let testGame: Game;
    let testResources: GameResources;
    let testEmbedState: SceneEmbedState;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testResources = new GameResources();
        testEmbedState = new SceneEmbedState(testResources, <GameScene>testGame.defaultScene);

        testResources.defineScene('scnEmbed', { width: 300, height: 200 });
    });

    it('creates SceneEmbeds', () => {
        testEmbedState.create('scnEmbed');
        const embeds = testEmbedState.getAll();

        expect(embeds.length).toBe(1);
        expect(embeds[0].scene.name).toBe('scnEmbed');
        expect(embeds[0].scene.height).toBe(200);
        expect(embeds[0].scene.width).toBe(300);
    });
    
    it('enumerates a callback over its ActorInstances', () => {
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });

        testEmbedState.forEach(embed => embed.scene.state.foo = 'bar');
        testEmbedState.forEach(embed => expect(embed.scene).toBe(testResources.getScene('scnEmbed')));
        testEmbedState.forEach(embed => expect(embed.scene.state.foo).toBe('bar'));
    });

    it('gets all SceneEmbeds of a given display mode', () => {
        testResources.defineScene('scnEmbed2');

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