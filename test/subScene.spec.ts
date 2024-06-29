import { Game } from './../engine/game';
import { SubScene } from './../engine/scene/subScene';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestUtil } from './testUtil';

describe('SubScene', () => {
    let testGame: Game;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
    });
    
    it('can be instantiated with default options', () => {
        const testId = 123;
        const subScene = new SubScene(testId, testGame.controller.sceneState);

        expect(subScene.id).toBe(testId);
        expect(subScene.height).toBe(testGame.defaultScene.height);
        expect(subScene.width).toBe(testGame.defaultScene.width);
        expect(subScene.depth).toBe(0);
        expect(subScene.x).toBe(0);
        expect(subScene.y).toBe(0);
    });

    it('detects whether a position (x,y) is within it', () => {
        const subScene = new SubScene(123, testGame.controller.sceneState, { x: 10, y: 20, height: 100, width: 200 });

        expect(subScene.containsPosition(0, 0)).toBeFalse();
        expect(subScene.containsPosition(10, 19)).toBeFalse();
        expect(subScene.containsPosition(10, 20)).toBeTrue();
        expect(subScene.containsPosition(210, 100)).toBeTrue();
        expect(subScene.containsPosition(211, 101)).toBeFalse();
    });

    it('can be destroyed', () => {
        const subScene = new SubScene(123, testGame.controller.sceneState);
        expect(subScene.isDestroyed).toBeFalse();

        subScene.destroy();

        expect(subScene.isDestroyed).toBeTrue();
    });

    it('can be drawn on a GameCanvas', () => {
        const subScene = new SubScene(123, testGame.controller.sceneState);
        const mockCanvas = <MockGameCanvas>testGame.canvas;
        
        expect(mockCanvas.drawnImages.length).toBe(0);
        subScene.draw(mockCanvas, mockCanvas, testGame.controller);

        expect(mockCanvas.drawnImages.length).toBe(1);
    });
});