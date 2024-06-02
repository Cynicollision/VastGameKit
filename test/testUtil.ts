import { Controller, SceneController } from './../engine/controller';
import { GameInputHandler } from './../engine/device/input';
import { Game, GameOptions } from './../engine/game';
import { Scene, GameScene } from './../engine/scene';
import { Sprite, SpriteOptions } from './../engine/sprite';
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

    static getTestController(game: Game, scene?: Scene): Controller {
        return new Controller(game, scene || <Scene>game.defaultScene);
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

    static getTestScene(game: Game): GameScene {
        return Scene.new('testScene', game);
    }

    static startScene(game: Game, scene: GameScene): Controller {
        const sc = new Controller(game, <Scene>scene);
        (<Scene>scene).startOrResume(sc);
        return sc;
    }
}
