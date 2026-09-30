import { Game, SpriteTransformation } from './../../engine';
import { Tile } from './../constants';
import { Sprites } from './../generated/art';

const BoxFrames = Sprites.sprBox.frames;
const CatFrames = Sprites.sprCat.frames;

export function buildScenery(game: Game): void {
    const sprites = game.construction.sprites;

    // the boxes on the roof, where cats go to sleep.
    const actBox = game.construction.actors.add('actBox', { sprite: sprites.get('sprBox') });
    actBox.setRectBoundaryFromSprite();
    actBox.onCreate((self) => {
        self.depth = 10;
        self.animation.setFrame(self.state.filled ? BoxFrames.cat : BoxFrames.empty);
    });

    // where the level's Tiled map has walls and water. They aren't drawn: the map's tiles show them.
    game.construction.actors.add('actWall', { solid: true }).setRectBoundary(Tile, Tile);
    game.construction.actors.add('actWater').setRectBoundary(Tile, Tile);

    // the cat on the title screen, sitting and blinking now and then.
    const actTitleCat = game.construction.actors.add('actTitleCat', { sprite: sprites.get('sprCat') });
    actTitleCat.onCreate((self) => {
        self.state.clock = 0;
        self.animation.setFrame(CatFrames.down);
    });
    actTitleCat.onStep((self) => {
        const time = self.state.clock++ % 200;
        self.animation.setFrame(time > 190 || (time > 170 && time < 176) ? CatFrames.blink : CatFrames.down);
    });

    // a lost life, floating away.
    const actGhost = game.construction.actors.add('actGhost', { sprite: sprites.get('sprCat') });
    actGhost.onCreate((self) => {
        self.depth = -20;
        self.state.age = 0;
        self.animation.start(CatFrames.ghost1, CatFrames.ghost2, 250);
        self.motion.velocityY = -0.5;
    });
    actGhost.onStep((self) => {
        self.state.age++;
        self.motion.velocityX = Math.sin(self.state.age / 10) * 0.5;
        self.animation.setTransform(SpriteTransformation.Opacity, Math.max(0, 1 - self.state.age / 90));

        if (self.state.age >= 90) {
            self.destroy();
        }
    });
}
