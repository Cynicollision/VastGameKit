import { GameInputHandler } from './../engine/device/input';
import { Sprite, SpriteOptions } from './../engine/resources/sprite';
import { Game, GameOptions } from './../engine/game';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestImage1, TestImage2 } from './mocks/testImages';

export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return new Game(new MockGameCanvas(), new GameInputHandler(null, null), options);
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        options = options || { source: TestImage1.Source };
        return Sprite.new('testSprite', options);
    }

    static getTestSprite2(options?: SpriteOptions): Sprite {
        options = options || { source: TestImage2.Source };
        return Sprite.new('testSprite2', options);
    }
}
