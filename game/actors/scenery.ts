import { Game, SpriteTransformation } from './../../engine';
import { Colors, Tile } from './../constants';
import { Sprites } from './../generated/art';
import { drawText } from './../text';

// steps a fish stays in its box.
export const FishSteps = 300;

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

    // a fish in an empty box, for a while, worth extra points to the cat that gets it. It blinks before it goes.
    const actFish = game.construction.actors.add('actFish', { sprite: sprites.get('sprFish') });
    actFish.onCreate((self) => {
        self.depth = 5;
        self.state.age = 0;
    });
    actFish.onStep((self) => {
        self.state.age++;
        const blink = FishSteps - self.state.age < 60 && Math.floor(self.state.age / 5) % 2 === 0;
        self.animation.setTransform(SpriteTransformation.Opacity, blink ? 0.25 : 1);

        if (self.state.age >= FishSteps) {
            self.destroy();
        }
    });

    // points scored, floating up from where they were scored. It has no sprite: it only draws text.
    const actPoints = game.construction.actors.add('actPoints');
    actPoints.onCreate((self) => {
        self.depth = -30;
        self.state.age = 0;
        self.motion.velocityY = -0.4;
    });
    actPoints.onStep((self) => {
        if (++self.state.age > 50) {
            self.destroy();
        }
    });
    actPoints.onDraw((self, canvas) => {
        drawText(canvas, `${self.state.points}`, self.x + Tile / 2, self.y, { align: 'center', color: Colors.yellow });
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
