import { Scene } from '../engine/scene/scene';
import { Game, GameOptions } from './../engine/game';
import { SceneController } from '../engine/scene/controller';
import { Sprite, SpriteOptions } from './../engine/sprite/sprite';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestImage } from './mocks/testImage';
import { GameInputHandler } from '../engine/device/input';

export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static getMockInputHandler(): GameInputHandler {
        return new GameInputHandler(null, null)
    }

    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return Game.init(new MockGameCanvas(), this.getMockInputHandler(), options);
    }

    static getTestController(game: Game): SceneController {
        return new SceneController(game, this.getTestScene(game));
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

    static getTestScene(game: Game): Scene {
        return Scene.define('testScene', game);
    }
}
