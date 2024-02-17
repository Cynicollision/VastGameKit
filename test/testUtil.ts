import { Game, GameOptions, GameState } from './../engine/game';
import { Sprite, SpriteOptions } from './../engine/sprite';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { MockInputHandler } from './mocks/mockInputHandler';
import { TestImage } from './mocks/testImage';

export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static readonly inputHandler = new MockInputHandler();

    static getTestGame(options?: GameOptions): Game {
        options = options || TestUtil.defaultGameConfig;
        return new Game(options, new MockGameCanvas(), TestUtil.inputHandler);
    }

    static getTestState(game: Game): GameState {
        return new GameState(game);
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }
}
