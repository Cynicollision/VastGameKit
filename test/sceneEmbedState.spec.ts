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
        testEmbedState = new SceneEmbedState(testGame.controller);

        testGame.construct.defineScene('scnEmbed', { width: 300, height: 200 });
    });

    it('creates SceneEmbeds', () => {
        testEmbedState.create('scnEmbed');
        const embeds = testEmbedState.toList();

        expect(embeds.length).toBe(1);
        expect(embeds[0].sceneState.scene.name).toBe('scnEmbed');
        expect(embeds[0].sceneState.scene.height).toBe(200);
        expect(embeds[0].sceneState.scene.width).toBe(300);
    });

    it('deletes destroyed SceneEmbeds during step', () => {
        const embed = testEmbedState.create('scnEmbed');
        let embeds = testEmbedState.toList();

        expect(embeds.length).toBe(1);
        expect(embeds[0].sceneState.scene.name).toBe('scnEmbed');
        expect(embeds[0].sceneState.scene.height).toBe(200);
        expect(embeds[0].sceneState.scene.width).toBe(300);

        embed.destroy();
        testEmbedState.step(testGame.controller);
        embeds = testEmbedState.toList();

        expect(embeds.length).toBe(0);
    });

    xit('TODO draws SceneEmbeds by depth', () => {

    });
    
    it('enumerates a callback over its ActorInstances', () => {
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });
        testEmbedState.create('scnEmbed', { x: 10, y: 20 });

        testEmbedState.forEach(embed => embed.sceneState.state.foo = 'bar');
        testEmbedState.forEach(embed => expect(embed.sceneState.scene).toBe(<GameScene>testGame.construct.getScene('scnEmbed')));
        testEmbedState.forEach(embed => expect(embed.sceneState.state.foo).toBe('bar'));
    });
});