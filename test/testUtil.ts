import { GameInputHandler } from './../engine/device/input';
import { Game, GameOptions } from './../engine/game';
import { Sprite, SpriteOptions } from './../engine/sprite';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestImage } from './mocks/testImage';

export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return new Game(new MockGameCanvas(), new GameInputHandler(null, null), options);
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

}
