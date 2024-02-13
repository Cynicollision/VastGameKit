import { BrowserDocumentInputHandler, GameCanvasHtml2D } from './device';
import { Game, GameError, GameOptions } from './game';

export class VastGameKit {

    static init(options: GameOptions): Game {
        try {
            const canvasElement = <HTMLCanvasElement>document.getElementById(options.canvasElementId);
            const canvas = GameCanvasHtml2D.initForElement(canvasElement);
            const inputHandler = BrowserDocumentInputHandler.initForElement(document.body);
            const game = new Game(options, canvas, inputHandler);

            return game;
        }
        catch (error) {
            const message = error.message ? error.message : error;
            console.error(`Vastgame failed to initialize. ${message}`);
            throw new GameError(message, error);
        }
    }
}
