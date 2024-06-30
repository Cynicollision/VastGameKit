import { Game } from './../../engine/game';

export function buildDummyButton(game: Game) {

    const button = game.construction.defineActor('actButton');
    button.sprite = game.construction.defineSprite('sprButton', './resources/pinkblue.png', { height: 32, width: 32 });

    button.onCreate((self, sc) => {
        button.setRectBoundaryFromSprite();
    });

    button.onPointerInput('mousedown', (self, event, controller) => {
        if (self.animation.stopped) {
            self.animation.start(0, 1, 100);
        }
        else {
            self.animation.stop();
        }
    });

    button.onKeyboardInput('t', ((self, event, controller) => {
        self.destroy();
    }));

    button.onGameEvent('startAll', (self, event, controller) => {
        self.animation.start(0, 1, event.data.speed);
    });

    button.onGameEvent('endAll', (self, event, controller) => {
        self.animation.stop();
    });  
}