import { GameResources } from '../engine/gameResources';
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

    // TODO replace with "TestGameBuilder"
    static getTestGame(options?: GameOptions): Game {
        options = options || this.defaultGameConfig;
        return new Game(new MockGameCanvas(), this.getMockInputHandler(), options);
    }

    static getTestController(game: Game, scene?: Scene): Controller {
        return new Controller(game.resources, scene || <Scene>game.defaultScene, { pulseLength: 30 });
    }

    static getTestSprite(options?: SpriteOptions): Sprite {
        return Sprite.fromSource('testSprite', TestImage.Source, options);
    }

    static getTestScene(game: Game): GameScene {
        return Scene.new('testScene', game.resources);
    }

    static startScene(game: Game, scene: GameScene): Controller {
        const sc = new Controller(game.resources, <Scene>scene, { pulseLength: 30 });
        (<Scene>scene).startOrResume(sc);
        return sc;
    }
}
