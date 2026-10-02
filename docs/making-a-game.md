# Making a game

A game made with VastGameKit lives in its own repository and depends on the engine as a package. This guide covers
setting one up, how a game is put together, and each of the engine's features. For a complete small game to start from,
see [A minimal game](a-minimal-game.md); for a bigger one, Nine Lives in this repo's [`game/`](../game) folder.

- [Setting up a project](#setting-up-a-project)
- [How a game is put together](#how-a-game-is-put-together)
- [Features](#features): [motion and collision](#motion-and-collision), [sprites](#sprites-and-animation),
  [drawing](#drawing), [scenes and cameras](#scenes-cameras-and-sub-scenes), [input](#keyboard-pointer-and-events),
  [touch buttons](#touch-buttons), [audio](#audio), [timers](#timers), [saved values](#saved-values),
  [display scaling](#display-scaling)
- [Tiled maps](#tiled-maps)
- [Deploying](#deploying)

## Setting up a project

Games install the engine from git rather than npm. Installing it builds the engine into the package's `lib/`, with
type declarations, so it's imported like any other package.

```
my-game/
├── package.json
├── tsconfig.json
├── webpack.config.js
├── src/
│   └── main.ts        the game's code, starting here
└── public/            the folder to upload
    ├── index.html
    ├── game_bundle.js (built)
    └── resources/     images, sounds, and maps
```

```jsonc
// package.json
{
  "private": true,
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    // a tagged version of the engine.
    "vastgame": "github:Cynicollision/VastGameKit#v1.0.0"
  },
  "devDependencies": {
    "ts-loader": "^9.5.1",
    "typescript": "^5.3.3",
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.0.4"
  }
}
```

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020", "dom", "dom.iterable"],
    "module": "es2020",
    "moduleResolution": "node",
    "strict": true
  }
}
```

```js
// webpack.config.js: bundles src/main.ts next to the page in public/
const path = require('path');

module.exports = (env, argv) => ({
    entry: './src/main.ts',
    devtool: argv.mode === 'production' ? false : 'inline-source-map',
    devServer: { static: path.join(__dirname, 'public') },
    module: { rules: [{ test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader' }] },
    resolve: { extensions: ['.ts', '.js'] },
    output: { filename: 'game_bundle.js', path: path.join(__dirname, 'public') },
});
```

The page needs a `<canvas>` for the game, sized to the game's resolution, and the bundle:

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>My Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { background-color: #000; margin: 0; }
        </style>
        <script src="game_bundle.js" defer></script>
    </head>
    <body>
        <canvas id="gameCanvas" width="320" height="192"></canvas>
    </body>
</html>
```

Then `npm install`, `npm start` to play it at http://localhost:8080 while editing, and `npm run build` for a production
build to upload.

### Updating the engine

To move to a newer version, change the tag in `package.json` and run `npm install`. To change the engine alongside a
game, point the dependency at a local copy of this repo instead, with `"vastgame": "file:../VastGameKit"`, and run
`npm run build:lib` in the engine after changing it. Switch back to a tag before deploying.

## How a game is put together

```ts
import { Game } from 'vastgame';

const game = Game.init({ canvasElementId: 'gameCanvas', name: 'myGame', canvasOptions: { scale: 'integer' } });

// define resources, then load them...
game.construction.sprites.add('sprHero', { source: './resources/hero.png', width: 16, height: 16 });

game.load().then(() => {
    // ...then define Actors and Scenes, and start.
    game.start();
});
```

`Game.init` takes the canvas's element id, and:

| Option | |
| --- | --- |
| `name` | keeps the game's saved values separate from other games on the same site |
| `canvasOptions` | `scale` for [display scaling](#display-scaling), `width` and `height` (default: the canvas element's), `backgroundColor`, `imageSmoothing` (default off, for pixel art), `fullScreen` |
| `targetFPS` | steps per second (default 60) |
| `defaultSceneOptions` | the size of the Scene the game starts in |
| `runWhileHidden` | keep running while the page is in a background tab (default false) |

The engine separates what a game *is* from what's happening while it runs.

**Construction** (`game.construction`) defines the game before it starts: registries of `actors`, `scenes`, `sprites`,
`sounds`, `tileMaps`, and `fonts`, each added and gotten by name. `game.load()` loads every sprite, sound, map, and font.

- An **Actor** is a kind of thing (a player, a wall, a coin): its sprite, boundary, whether it's solid, and lifecycle
  callbacks.
- A **Scene** is a place (a level, a menu, a HUD): its size, background, whether it's persistent, and lifecycle callbacks.

**State** is created from those definitions while the game runs.

- An **Instance** is one Actor in a Scene, with its own position, depth, motion, animation, and `state` object.
- A **SceneState** is a running Scene, with its Instances, cameras, sub-scenes, timers, and `state` object. Persistent
  Scenes keep their state when the game leaves and returns to them; others start over each time.
- The **Controller** (passed to every callback) runs the current Scene and holds what's shared across Scenes: input,
  audio, storage, timers, events, scene changes, and a `state` object.

The game starts in `game.defaultScene`. A game with several Scenes usually goes from there to its first one:

```ts
game.defaultScene.onStart((self, controller) => controller.goToScene('scnTitle'));
```

As a game grows, it helps to give each Actor and Scene its own file with a function that defines it, called from
`main.ts` after `game.load()`. Nine Lives is organized that way (`game/actors/`, `game/scenes/`).

### Lifecycle callbacks

Actors and Scenes take callbacks, each given the Instance or SceneState (`self`) and the Controller:

| Callback | Called |
| --- | --- |
| `onCreate` / `onDestroy` (Actors) | on an Instance's first step, and on the step after `destroy()` |
| `onStart` / `onResume` / `onSuspend` (Scenes) | when a Scene first runs, returns, or is left; with the data given to the scene change |
| `onStep` | every step, before motion, animation, and collisions |
| `onDraw` | after the Instance or Scene draws |
| `onCollision(actorName, cb)` (Actors) | each step an Instance overlaps an Instance of the named Actor |
| `onKeyboardInput(key, cb)` | on keydown and keyup of a key (check `event.type` and `event.repeat`) |
| `onPointerInput(type, cb)` | on `'pointerdown'`, `'pointermove'`, or `'pointerup'` (mouse, touch, or pen) over an Instance, or anywhere in a Scene |
| `onGameEvent(name, cb)` | on the next step after `controller.publishEvent(name, data)` |

### Steps and time

The game steps at a fixed rate (`targetFPS`, default 60), and everything that takes time counts steps:
`controller.stepDurationMs` is the game time of one step. Drawing happens once per browser frame. While the page is
hidden the game pauses, and when it returns it continues without catching up. `game.pause()` and `game.resume()` do the
same on demand.

## Features

### Motion and collision

```ts
actor.setRectBoundaryFromSprite();  // or setRectBoundary(w, h), setCircleBoundaryFromSprite()...
self.motion.speed = 2;              // pixels per step
self.motion.direction = 45;         // degrees: Direction.Right = 0, Down = 90, Left = 180, Up = 270
self.motion.velocityX = 1.5;        // or set the velocity directly; speed and direction follow it
```

Moving Instances stop short of solid Instances, sliding along them diagonally. They stay on whole pixels, carrying
fractions of a pixel over to later steps, so any speed moves smoothly. After moving, `motion.blockedX` and
`motion.blockedY` say whether a solid is right against the Instance in the direction it's moving, and
`self.isPlaceFree(x, y)` checks a position. For example, a platformer's gravity and jumping:

```ts
player.onStep((self, controller) => {
    const onGround = self.motion.blockedY && self.motion.velocityY > 0;
    self.motion.velocityY = onGround ? 0.3 : Math.min(self.motion.velocityY + 0.3, 6);
    if (onGround && controller.keyboard.wasPressed(' ')) {
        self.motion.velocityY = -5;
    }
    if (self.motion.blockedY && self.motion.velocityY < 0) {
        self.motion.velocityY = 0; // bumped a ceiling
    }
});
```

Queries on `self.instances` (a SceneState's) find Instances: `getAll(actorName)`, and by position, `getAtPosition`,
`getWithinBoundaryAtPosition`, `isPositionFree`, and `isAreaFree`. A spatial grid keeps these and collision checks fast
in large scenes.

### Sprites and animation

```ts
game.construction.sprites.add('sprCoin', { source: './resources/coin.png', width: 16, height: 16 }); // a sheet of frames
self.animation.start(0, 3, 100, { loop: true });   // frames 0 to 3, 100ms each
self.animation.setFrame(0);          // stop on a frame
self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
self.animation.flipX = true;         // face the other way
self.animation.setTransform(SpriteTransformation.Rotation, 90);   // also ScaleX and ScaleY
```

Flips, scaling, and rotation apply around the sprite's center, so they don't move it. `self.setSprite(sprite)` switches
an Instance to another Sprite, like a separate sheet for attacking, keeping its flip, scale, rotation, and opacity.

### Drawing

`onDraw` callbacks draw on the canvas, in Scene coordinates for Instances and embedded sub-scenes:

```ts
actor.onDraw((self, canvas, controller) => {
    canvas.drawLine('#fff', self.x, self.y, aimX, aimY, { width: 2, opacity: 0.5 });
    canvas.fillCircle('#000', holeX, holeY, 4);             // also drawCircle, fillArea, drawRect
    canvas.drawText(`${score}`, 160, 8, { align: 'center', baseline: 'top', font: '12px monospace', color: '#fff' });
});
```

CSS fonts blur when a small canvas is scaled up. For crisp pixel text, add a bitmap font: an image of equally sized
glyphs, with the characters they are in order.

```ts
game.construction.fonts.add('fntPixel', {
    source: './resources/font.png',
    width: 8, height: 8,              // each glyph
    characters: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?',
    letterSpacing: 0, lineSpacing: 2, // optional
});

const font = game.construction.fonts.get('fntPixel');
canvas.drawText('GAME OVER\nPRESS START', 112, 128, { font: font, align: 'center', baseline: 'middle', color: '#ff0' });
canvas.measureText('GAME OVER', font); // 72
```

Glyphs are drawn on whole pixels, recolored to `color` if given (draw them in white), and a font with only one case of
letters draws the other case too. Characters the font doesn't have are left blank. `'\n'` starts a new line, and
`baseline: 'alphabetic'` (the default) puts the bottom of the glyphs at `y`.

### Scenes, cameras, and sub-scenes

```ts
const level = game.construction.scenes.add('scnLevel1', { width: 1024, height: 768, persistent: true });
level.background.setFromSprite(game.construction.sprites.get('sprGrass')); // or setFromColor, setFromTileMap

level.onStart((self, controller, data) => {
    const player = self.instances.create('actPlayer', { x: data.x, y: data.y });
    self.defaultCamera.follow(player, { centerOnTarget: true });
    self.addCamera('minimap', { width: 1024, height: 768, portX: 520, portY: 8, portWidth: 112, portHeight: 84 });
    self.floatSubScene('scnHUD', { x: 0, y: 0 });  // drawn over the cameras
});

controller.goToScene('scnLevel1', { x: 32, y: 32 });
controller.transitionToScene('scnLevel2', { durationMs: 400, color: '#000' }, { x: 32, y: 32 }); // fade out and in
```

A camera shows a rectangle of the Scene (`x`, `y`, `width`, `height`) in a rectangle of the canvas (`portX`, `portY`,
`portWidth`, `portHeight`), scaling to fit. A following camera stays with its target; with a `maxSpeed` (pixels per
step) it pans instead when the target jumps, e.g. to a player starting over. Sub-scenes run a Scene inside another:
*embedded* sub-scenes are part of the Scene's world, and *floating* ones sit above it on the canvas, like a HUD or a
dialog.

For simple levels, `self.instances.createFromMap` places Instances from rows of text, one character per tile:

```ts
self.instances.createFromMap(16, [
    '##########',
    '#P   c   #',
    '##########',
], { '#': 'actWall', 'P': 'actPlayer', 'c': 'actCoin' });
```

For anything bigger, see [Tiled maps](#tiled-maps).

### Keyboard, pointer, and events

```ts
controller.keyboard.isDown('a');         // held
controller.keyboard.wasPressed('Enter'); // went down since the previous step
controller.keyboard.wasReleased(' ');    // went up since the previous step
```

Keys are key values (`'a'`, `'ArrowLeft'`, `' '`, case-insensitive for letters) or codes (`'KeyA'`, `'Space'`) for
the physical key regardless of layout. Arrow keys and space don't scroll the page, typing into page form fields is
ignored, and held keys are released when the window loses focus.

```ts
const pointer = controller.pointer;      // mouse, touch, and pen alike
if (pointer.wasPressed) { ... }          // also isDown and wasReleased
const aim = { x: pointer.pressX - pointer.x, y: pointer.pressY - pointer.y };  // dragging back from the press
if (pointer.swipe === Direction.Up) { ... }                                    // a swipe released this step
const target = controller.sceneState.toScenePosition(pointer.x, pointer.y);    // through the camera showing it
```

Pointer positions are in canvas pixels, however the canvas is scaled on the page. A drag keeps reporting after it leaves
the canvas, touching the canvas doesn't scroll the page, and `pointer.pointers` has every touch for multi-touch.

Game events pass messages between parts of a game without them knowing about each other, like a player telling the
HUD it scored:

```ts
controller.publishEvent('scored', { points: 10 });
hud.onGameEvent('scored', (self, event) => self.state.score += event.data.points);
```

### Touch buttons

Games played with a keyboard can add on-screen buttons and a d-pad that press keys, so they can be played on phones:

```ts
controller.setTouchButtons([
    { key: 'ArrowLeft', x: 8, y: 140, width: 32, height: 32, label: '◀' },
    { key: 'ArrowRight', x: 44, y: 140, width: 32, height: 32, label: '▶' },
    { key: ' ', x: 276, y: 136, width: 36, height: 36, shape: 'circle', label: 'A' },
]);
```

Buttons (in canvas coordinates) appear once the player touches the screen, so they're never in the way on a computer
(set `controller.touchControls.visibility` to `'always'` or `'never'` to change that). Labels can have a `font`, such
as a bitmap font. Pressing one is the same as pressing its key, for `controller.keyboard` and `onKeyboardInput` alike. A
touch that starts on a button slides between buttons like a d-pad and isn't pointer input; other touches are.

A d-pad is a disc that presses one of four keys (the arrow keys by default) for the direction a touch is from its
center, so one thumb can rock between directions. The touch keeps steering it after sliding off the disc, and pressing
near the center presses nothing. For games without diagonal moves, a `diagonalGap` (in degrees) around each diagonal
presses nothing new, so a slightly-off touch doesn't press the wrong direction:

```ts
controller.setTouchDPad({ x: 40, y: 140, radius: 28 });  // also keys, deadZone (0.25 of the radius), diagonalGap, font
controller.setTouchDPad(undefined);                      // removes it
```

### Audio

```ts
game.construction.sounds.add('sndCoin', { source: './resources/coin.wav' });

controller.audio.play('sndCoin', { volume: 0.5, pan: -0.5, rate: 1.2 }); // returns a playback with stop()
controller.audio.playMusic('bgmLevel1');  // loops, replacing other music
controller.audio.muted = true;            // also volume, musicVolume, soundVolume
```

Browsers only allow audio after the player interacts with the page, so audio unlocks on the first click, tap, or key
press. Sounds played before then are skipped; music starts once audio unlocks.

### Timers

```ts
const timer = self.startTimer({ durationSteps: 120 }); // on a SceneState: runs only while the Scene does
timer.onEnd(() => self.instances.create('actEnemy', { x: 0, y: 0 }));
controller.startTimer({ durationSteps: 60 });          // runs regardless of Scene
```

A timer runs once; `timer.reset()` starts it over, including from its `onEnd` to repeat it.

### Saved values

```ts
controller.storage.set('highScores', scores);
const scores = controller.storage.get<number[]>('highScores', []);
```

Values are JSON, saved in the browser's local storage under the game's `name`. If the browser won't save them (for
example in private browsing), they last until the page closes.

### Display scaling

`canvasOptions.scale` keeps the canvas's resolution and scales how it's displayed to fit its parent element's width and
the window's height. `'integer'` scales by whole screen pixels so pixel art stays crisp; `'fit'` fills the space
exactly. Without it, `fullScreen: true` resizes the canvas to the window instead.

Phones' dense screens can leave a wide border around an `'integer'`-scaled game, so Nine Lives uses `'fit'` when
`window.devicePixelRatio >= 2`, where the unevenness is too small to see.

## Tiled maps

[Tiled](https://www.mapeditor.org/) can be used as a scene editor. Paint tile layers for how a level looks, a tile layer
for where walls go, and an object layer for where things start:

```ts
game.construction.tileMaps.add('mapLevel1', { source: './resources/tilemaps/level1.tmx' });

level.onStart((self) => {
    const map = game.construction.tileMaps.get('mapLevel1');
    self.scene.background.setFromTileMap(map, ['Ground', 'Details']); // or all visible tile layers
    self.instances.createFromTileLayer(map, 'Walls', 'actWall');      // an Instance on each tile
    self.instances.createFromTileMapObjects(map, 'Actors');           // object class = Actor name
});
```

Objects' custom properties are copied to their Instance's `state`. Maps must be orthogonal and not infinite, with the
Tile Layer Format set to CSV (or uncompressed Base64). Tilesets can be embedded or external (`.tsx`), with one image
each. Nine Lives' `game/resources/maps/level.tmx` is a full example, with lane speeds and spacing as custom properties.

## Deploying

`npm run build` bundles the game for production into `public/`. Upload that folder's contents anywhere that serves
static files; the game works from a subfolder too. The page can also be embedded in another page; with `scale` set, the
game fits the element it's placed in.
