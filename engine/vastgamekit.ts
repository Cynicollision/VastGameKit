import { GameCanvasHtml2D } from './device/canvas';
import { BrowserDocumentInputHandler } from './device/input';
import { Game, GameOptions } from './game/game';
import { GameError } from './game/gameError';

export class VastGameKit {

    static init(options: GameOptions): Game {
        try {
            const canvas = GameCanvasHtml2D.initForElementId(options.canvasElementId);
            const inputHandler = BrowserDocumentInputHandler.initForElement(document.body);
            return Game.init(canvas, inputHandler, options);
        }
        catch (error) {
            const message = error.message ? error.message : error;
            console.error(`Vastgame failed to initialize. ${message}`);
            throw new GameError(message, error);
        }
    }
}
