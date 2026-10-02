# A minimal game

*Coin Dash* is a small but complete game: walk a maze with the arrow keys and grab as many coins as you can in 30
seconds. There are always five coins, each one taken replaced by another somewhere random, and the best score is saved.
It's about 140 lines, in one file, and uses the parts of the engine most games need: sprites, animation, sound, solid
walls, collision, keyboard input, a timer, game events, text, saved values, and restarting a Scene.

## Setting up

Set up a project as in [Making a game](making-a-game.md#setting-up-a-project), with a 320×192 canvas, and put these in
`public/resources/`:

| File | |
| --- | --- |
| `hero.png` | 32×16: two 16×16 frames side by side, standing and mid-step, facing right |
| `coin.png` | 64×16: four 16×16 frames of a coin spinning |
| `wall.png` | 16×16 |
| `coin.wav` | a short sound for picking up a coin |

Then this is all of `src/main.ts`:

```ts
import { Game, SceneState } from 'vastgame';

const game = Game.init({
    canvasElementId: 'gameCanvas',       // the <canvas> on the page
    name: 'coinDash',                    // keeps saved values apart from other games on the same site
    canvasOptions: { scale: 'integer' }, // crisp, whole-number scaling to fit the page
});

const { actors, scenes, sounds, sprites } = game.construction;

sprites.add('sprHero', { source: './resources/hero.png', width: 16, height: 16 }); // 2 frames, side by side
sprites.add('sprCoin', { source: './resources/coin.png', width: 16, height: 16 }); // 4 frames
sprites.add('sprWall', { source: './resources/wall.png', width: 16, height: 16 });
sounds.add('sndCoin', { source: './resources/coin.wav' });

// one character per 16-pixel tile: # a wall, H the hero. The top row is left clear for the score.
const level = [
    '                    ',
    '####################',
    '#H                 #',
    '#  ####    #####   #',
    '#  #       #       #',
    '#  #       #  ###  #',
    '#     ###          #',
    '#     # #  ###   ###',
    '#                  #',
    '#####   ###   ##   #',
    '#                  #',
    '####################',
];

game.load().then(() => {
    // walls are solid, so moving Instances stop against them.
    const wall = actors.add('actWall', { sprite: sprites.get('sprWall'), solid: true });
    wall.setRectBoundaryFromSprite();

    const coin = actors.add('actCoin', { sprite: sprites.get('sprCoin') });
    const coinBoundary = coin.setRectBoundaryFromSprite();
    coin.onCreate((self) => self.animation.start(0, 3, 120, { loop: true }));

    const hero = actors.add('actHero', { sprite: sprites.get('sprHero') });
    hero.setRectBoundaryFromSprite();

    hero.onStep((self, controller) => {
        if (controller.sceneState.state.timeLeft === 0) {
            self.motion.stop();
            self.animation.setFrame(0);
            return;
        }

        const keys = controller.keyboard;
        const x = Number(keys.isDown('ArrowRight')) - Number(keys.isDown('ArrowLeft'));
        const y = Number(keys.isDown('ArrowDown')) - Number(keys.isDown('ArrowUp'));
        self.motion.velocityX = x * 2; // pixels per step
        self.motion.velocityY = y * 2;

        if (x !== 0) {
            self.animation.flipX = x < 0;
        }
        if (x === 0 && y === 0) {
            self.animation.setFrame(0); // standing
        }
        else if (self.animation.stopped) {
            self.animation.start(0, 1, 150, { loop: true }); // walking
        }
    });

    hero.onCollision('actCoin', (self, other, controller) => {
        other.destroy();
        controller.audio.play('sndCoin');
        controller.publishEvent('coinCollected');
    });

    // puts a coin on a random tile that's clear: not a wall, another coin, or where the hero is.
    const placeCoin = (self: SceneState) => {
        let x: number, y: number;
        do {
            x = 16 * Math.floor(Math.random() * level[0].length);
            y = 16 * (1 + Math.floor(Math.random() * (level.length - 1))); // below the score
        } while (!self.instances.isAreaFree(coinBoundary, x, y));

        self.instances.create('actCoin', { x: x, y: y });
    };

    const play = scenes.add('scnPlay', { width: 320, height: 192 });
    play.background.setFromColor('#1a1c2c');

    play.onStart((self, controller) => {
        self.instances.createFromMap(16, level, { '#': 'actWall', 'H': 'actHero' });
        for (let i = 0; i < 5; i++) {
            placeCoin(self);
        }
        self.state.score = 0;
        self.state.best = controller.storage.get('best', 0);
        self.state.timeLeft = 30;

        // ends every second (60 steps) and starts again, until time's up.
        const clock = self.startTimer({ durationSteps: 60 });
        clock.onEnd(() => {
            self.state.timeLeft--;
            if (self.state.timeLeft > 0) {
                clock.reset();
            }
            else if (self.state.score > self.state.best) {
                self.state.best = self.state.score;
                controller.storage.set('best', self.state.best);
            }
        });
    });

    // each coin taken is replaced by one somewhere else.
    play.onGameEvent('coinCollected', (self) => {
        self.state.score++;
        placeCoin(self);
    });

    play.onStep((self, controller) => {
        if (self.state.timeLeft === 0 && controller.keyboard.wasPressed(' ')) {
            controller.goToScene('scnPlay'); // a Scene that isn't persistent starts over each time
        }
    });

    play.onDraw((self, canvas) => {
        const text = { baseline: 'top', font: '10px monospace', color: '#fff' } as const;
        canvas.drawText(`COINS ${self.state.score}`, 8, 4, text);
        canvas.drawText(`TIME ${self.state.timeLeft}`, 160, 4, { ...text, align: 'center' });
        canvas.drawText(`BEST ${self.state.best}`, 312, 4, { ...text, align: 'right' });

        if (self.state.timeLeft === 0) {
            canvas.fillArea('#000', 64, 72, 192, 48, { opacity: 0.8 });
            canvas.drawText("TIME'S UP!", 160, 80, { ...text, align: 'center', font: '16px monospace' });
            canvas.drawText('Press space to play again', 160, 102, { ...text, align: 'center' });
        }
    });

    // the game starts in its default Scene, so go from there to the real one.
    game.defaultScene.onStart((self, controller) => controller.goToScene('scnPlay'));
    game.start();
});
```

`npm start`, open http://localhost:8080, and click the page or press a key to let it play sound.

## How it works

### Starting up

`Game.init` finds the canvas and sets the game up. `name` is the prefix for the game's saved values in the browser, so
two games on the same site don't overwrite each other's best scores, and `scale: 'integer'` makes the 320×192 canvas
as big as fits the window, in whole screen pixels so the pixel art stays sharp.

Next, the sprites and sound are added to `game.construction` by name, and `game.load()` loads them all. A sprite's
`width` and `height` are the size of one frame; an image wider than that is a sheet of frames, numbered from 0.

### The level

`level` is the maze as text, one character per 16-pixel tile. When the Scene starts, `self.instances.createFromMap`
turns it into Instances: an `actWall` for each `#` and the `actHero` at `H`. Spaces, and any character not in the key,
are left empty.

Coins go wherever there's room, by `placeCoin`. It picks a random tile below the score, and asks
`self.instances.isAreaFree` whether a coin's boundary would overlap anything there: a wall, another coin, or the hero.
If it would, it picks again. Every open tile in the maze can be reached, so a coin is never out of reach.

### The actors

Everything else in the game is defined once `game.load()` has finished, since Actors use the loaded sprites.

- **`actWall`** is `solid`, so moving Instances stop against walls and slide along them. `setRectBoundaryFromSprite`
  gives it a boundary the size of its sprite, for colliding.
- **`actCoin`** starts its spinning animation in `onCreate`: frames 0 to 3, 120 ms each, looping. Every coin is an
  Instance of the same Actor, with its own animation.
- **`actHero`** reads the arrow keys every step in `onStep`, and sets its velocity from them, in pixels per step. The
  engine does the moving and stops it at walls. It faces left by flipping its sprite, and walks by looping frames 0
  and 1 while moving (`animation.stopped` is true until an animation starts, and again after `setFrame`).

`hero.onCollision('actCoin', ...)` runs on each step the hero overlaps a coin, with the coin as `other`. It destroys
the coin, plays the sound, and publishes a `coinCollected` event, rather than updating the score itself: the hero
doesn't need to know how the score is kept.

### The scene

`scnPlay` is the game's one real Scene, 320×192 like the canvas, so it all fits without a camera that moves. It's not
`persistent`, so each time the game goes to it, it starts over with a new SceneState.

- **`onStart`** creates the level, places five coins, and sets up the SceneState's `state`: the score, the best score saved last time (or
  0), and the time left. Then it starts a timer for 60 steps, one second at the default 60 steps per second. Each time
  the timer ends, it counts down a second and resets itself, until time's up, when it saves a new best score. A
  SceneState's timers only run while its Scene does.
- **`onGameEvent('coinCollected')`** adds to the score on the step after a coin is taken, and places a new one.
- **`onStep`** waits for space once time's up, and goes to `scnPlay` again, which starts it over. The hero stops
  itself once time's up, by checking the SceneState's `state` through `controller.sceneState`.
- **`onDraw`** draws the score and time along the top row, which the level leaves empty, and a message once time's up.
  A Scene's `onDraw` is called after its background and Instances are drawn, so this is drawn over them.

The game always starts in `game.defaultScene`, so its `onStart` goes straight to `scnPlay`, and `game.start()` begins
the game loop.

## Where to go next

Some ways to grow Coin Dash, each covered in [Making a game](making-a-game.md):

- **Play on phones**: `controller.setTouchDPad({ x: 40, y: 152, radius: 28 })` in `onStart` adds an on-screen d-pad
  that presses the arrow keys, shown once the player touches the screen.
- **Sharper text**: a [bitmap font](making-a-game.md#drawing) draws pixel text that stays crisp when the canvas is
  scaled up, unlike the CSS font here.
- **A bigger maze**: make the Scene larger than the canvas and have the default camera follow the hero with
  `self.defaultCamera.follow(hero, { centerOnTarget: true })`, moving the score into a
  [floating sub-scene](making-a-game.md#scenes-cameras-and-sub-scenes) so it stays put.
- **More levels**: draw them in [Tiled](making-a-game.md#tiled-maps), and go between them with
  `controller.transitionToScene` to fade out and in.
- **A title screen**: a second Scene for the default Scene to go to first, which goes to `scnPlay` when a key is
  pressed.
