import { Controller } from '../engine/controller';
import { GameInputHandler } from './../engine/device/input';
import { Game, GameOptions } from './../engine/game';
import { Scene, GameScene } from './../engine/scene';
import { Sprite, SpriteOptions } from '../engine/sprite';
import { MockGameCanvas } from './mocks/mockGameCanvas';
import { TestImage } from './mocks/testImage';


export class TestUtil {

    private static readonly defaultGameConfig: GameOptions = { 
        canvasElementId: 'test', 
    };

    static getMockInputHandler(): GameInputHandler {
        return new GameInputHandler(null, null)
    }

    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return new Game(new MockGameCanvas(), this.getMockInputHandler(), options);
    }

    static getTestController(game: Game): Controller {
        return new Controller(game, <Scene>this.getTestScene(game));
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

    static getTestScene(game: Game): GameScene {
        return Scene.define('testScene', game);
    }
}
