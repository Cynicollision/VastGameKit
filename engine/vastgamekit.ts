import { BrowserDocumentInputHandler, GameCanvasHtml2D } from './device';
import { Game, GameError, GameOptions } from './game';

export class VastGameKit {

    static init(options: GameOptions): Game {
        try {
            const canvas = GameCanvasHtml2D.defineForHtmlCanvasElement(options.canvasElementId);
            const inputHandler = BrowserDocumentInputHandler.init();
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
