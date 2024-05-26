import { Scene } from '../engine/scene/scene';
import { Game, GameOptions } from './../engine/game/game';
import { GameController } from './../engine/game/controller';
import { Sprite, SpriteOptions } from './../engine/sprite/sprite';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { MockInputHandler } from './mocks/mockInputHandler';
import { TestImage } from './mocks/testImage';

export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static readonly inputHandler = new MockInputHandler();

    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return Game.init(new MockGameCanvas(), this.inputHandler, options);
    }

    static getTestController(game: Game): GameController {
        return new GameController(game, this.getTestScene(game));
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

    static getTestScene(game: Game): Scene {
        return Scene.define('testScene', game);
    }
}
