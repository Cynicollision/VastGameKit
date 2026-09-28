import { GameError, SpriteTransformation } from './../engine/core';
import { SpriteAnimation } from './../engine/resources/spriteAnimation';
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

describe('SpriteAnimation stepping', () => {
    let animation: SpriteAnimation;

    beforeEach(() => {
        animation = TestUtil.getTestSprite({ source: TestImage1.Source, width: 8, height: 8 }).newAnimation();
    });

    it('advances a frame each time its delay passes, then loops', () => {
        animation.start(0, 2, 100);

        animation.step(99);
        expect(animation.getTransform(SpriteTransformation.Frame)).toBe(0);

        animation.step(1);
        expect(animation.getTransform(SpriteTransformation.Frame)).toBe(1);

        animation.step(200);
        expect(animation.getTransform(SpriteTransformation.Frame)).toBe(0);
    });

    it('stops on its end frame when not looping, calling onEnd', () => {
        let endCount = 0;
        animation.start(0, 2, 100, { loop: false, onEnd: () => endCount++ });

        animation.step(1000);

        expect(animation.getTransform(SpriteTransformation.Frame)).toBe(2);
        expect(animation.stopped).toBeTrue();
        expect(endCount).toBe(1);
    });

    it('plays frames in reverse when the end frame is before the start frame', () => {
        animation.start(3, 1, 100);

        animation.step(200);

        expect(animation.getTransform(SpriteTransformation.Frame)).toBe(1);
    });

    it('does not advance while its Instance\'s Scene is paused', () => {
        const testGame = TestUtil.getTestGame();
        testGame.construction.actors.add('actAnimated', { sprite: TestUtil.getTestSprite() });
        const instance = testGame.controller.sceneState.instances.create('actAnimated');
        testGame.controller.sceneState.startOrResume(testGame.controller);
        testGame.controller.step(); // activates new instances

        instance.animation.start(0, 5, testGame.controller.stepDurationMs);
        testGame.controller.sceneState.paused = true;
        testGame.controller.step();
        expect(instance.animation.getTransform(SpriteTransformation.Frame)).toBe(0);

        testGame.controller.sceneState.paused = false;
        testGame.controller.step();
        expect(instance.animation.getTransform(SpriteTransformation.Frame)).toBe(1);
    });
});
