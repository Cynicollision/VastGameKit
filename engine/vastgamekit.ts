import { GameError } from './core/error';
import { Game, GameOptions } from './game';
import { GameCanvasHtml2D } from './device/canvas';
import { GameInputHandler } from './device/input';

export class VastGameKit {

    static init(options: GameOptions): Game {
        try {
            const canvasElement = <HTMLCanvasElement>document.getElementById(options.canvasElementId);
            const canvas = GameCanvasHtml2D.initForElement(canvasElement);
            const inputHandler = GameInputHandler.initForElement(document.body);
            return Game.init(canvas, inputHandler, options);
        }
        catch (error) {
            const message = error.message ? error.message : error;
            console.error(`Vastgame failed to initialize. ${message}`);
            throw new GameError(message, error);
        }
    }
}
