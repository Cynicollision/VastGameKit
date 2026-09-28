import { GameError } from './../engine/core';
import { Game } from './../engine/game';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestImage1 } from './mocks/testImages';
import { TestUtil } from './testUtil';

describe('SpriteAnimation', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actTest1', { sprite: TestUtil.getTestSprite() });
        testGame.construction.actors.add('actTest2');
        
    });

    it('is instantiated for an ActorInstance\'s Sprite', () => {
        const testInstance1 = testGame.controller.sceneState.instances.create('actTest1');
        const testInstance2 = testGame.controller.sceneState.instances.create('actTest2');
        expect(testInstance1.animation).toBeDefined();
        expect(() => testInstance2.animation).toThrowError(GameError);
    });
});

describe('SpriteAnimation drawing', () => {
    it('draws the given frame and opacity without changing the given options', async () => {
        const sprite = TestUtil.getTestSprite({ source: TestImage1.Source, width: 8, height: 8 });
        await sprite.loadImage();
        const animation = sprite.newAnimation();
        const canvas = new MockGameCanvas();
        const options = { frame: 5, opacity: 0 };

        animation.draw(canvas, 0, 0, options);

        const drawn = canvas.drawnImages[0];
        expect([drawn.sx, drawn.sy]).toEqual([8, 8]);
        expect(drawn.options!.opacity).toBe(0);
        expect(options).toEqual({ frame: 5, opacity: 0 });
    });

    it('draws its current frame by default', async () => {
        const sprite = TestUtil.getTestSprite({ source: TestImage1.Source, width: 8, height: 8 });
        await sprite.loadImage();
        const animation = sprite.newAnimation();
        const canvas = new MockGameCanvas();

        animation.setFrame(2);
        animation.draw(canvas, 0, 0);

        expect(canvas.drawnImages[0].sx).toBe(16);
        expect(canvas.drawnImages[0].options!.opacity).toBe(1);
    });
});
