# VastGameKit

A small 2D game engine for the browser, written in TypeScript and drawn on a canvas. It's built for simple games that
can be embedded in a web page: fixed-step updates, scenes with cameras, sprite animation, collision, keyboard and
pointer input, audio, saved values, and optional [Tiled](https://www.mapeditor.org/) maps.

## Getting started

```sh
npm install
npm run debug    # the demo at http://localhost:9000, rebuilt as you edit
npm test         # run the tests once (npm run test:watch to keep watching)
npm run lint
npm run build    # a production build of the game in dist/, ready to upload
```

The engine lives in `engine/`, with everything exported from `engine/index.ts`. The demo in `game/` tours the engine's
features and is a quick way to check they still work together: `game/main.ts` is its entry point, `game/index.html` its
page, and `game/resources/` its images, sounds, and maps.

## Making a game in its own repo

Games depend on this repo as a package, installed from git rather than npm. Installing it builds the engine into `lib/`.

```jsonc
// package.json
{
  "private": true,
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
  "dependencies": {
    // a tagged version of the engine. While changing the engine alongside a game, use "file:../VastGameKit" instead
    // (and run npm run build:lib in the engine after changing it).
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

Then `import { Game } from 'vastgame';` in `src/main.ts`, and put the page (with a `<canvas>` and
`<script src="game_bundle.js" defer>`) and resources in `public/`, which is the folder to upload.

## A minimal game

```ts
import { Direction, Game } from 'vastgame';

const game = Game.init({
    canvasElementId: 'gameCanvas',       // <canvas id="gameCanvas" width="320" height="180">
    name: 'myGame',                      // keeps saved values separate from other games on the site
    canvasOptions: { scale: 'integer' }, // crisp, whole-number scaling to fit the page
});

game.construction.sprites.add('sprHero', { source: './resources/hero.png', width: 16, height: 16 });
game.construction.sounds.add('sndJump', { source: './resources/jump.wav' });

game.load().then(() => {
    const hero = game.construction.actors.add('actHero', { sprite: game.construction.sprites.get('sprHero') });
    hero.setRectBoundaryFromSprite();

    hero.onStep((self, controller) => {
        const left = controller.keyboard.isDown('ArrowLeft');
        const right = controller.keyboard.isDown('ArrowRight');
        self.motion.speed = left !== right ? 2 : 0;
        self.motion.direction = left ? Direction.Left : Direction.Right;

        if (controller.keyboard.wasPressed(' ')) {
            controller.audio.play('sndJump');
        }
    });

    game.defaultScene.onStart((self) => {
        self.instances.create('actHero', { x: 32, y: 32 });
    });

    game.start();
});
```

## Concepts

The engine separates what a game *is* from what's happening while it runs.

**Construction** (`game.construction`) defines the game before it starts: registries of `actors`, `scenes`, `sprites`,
`sounds`, and `tileMaps`, each added by name. `game.load()` loads every sprite, sound, and map.

- An **Actor** is a kind of thing (a player, a wall, a coin): its sprite, boundary, whether it's solid, and lifecycle
  callbacks.
- A **Scene** is a place (a level, a menu, a HUD): its size, background, whether it's persistent, and lifecycle callbacks.

**State** is created from those definitions while the game runs.

- An **Instance** is one Actor in a Scene, with its own position, depth, motion, animation, and `state` object.
- A **SceneState** is a running Scene, with its Instances, cameras, sub-scenes, timers, and `state` object. Persistent
  Scenes keep their state when the game leaves and returns to them.
- The **Controller** (passed to every callback) runs the current Scene and holds what's shared across Scenes: input,
  audio, storage, timers, events, scene changes, and a `state` object.

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
 Queries on `self.instances` (a
SceneState's) find Instances by position: `getAtPosition`, `getWithinBoundaryAtPosition`, `isPositionFree`,
`isAreaFree`. A spatial grid keeps these and collision checks fast in large scenes.

### Sprites and animation

```ts
game.construction.sprites.add('sprCoin', { source: './resources/coin.png', width: 16, height: 16 }); // a sheet of frames
self.animation.start(0, 3, 100, { loop: true });   // frames 0 to 3, 100ms each
self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
self.animation.flipX = true;         // face the other way
self.animation.setTransform(SpriteTransformation.Rotation, 90);   // also ScaleX and ScaleY
```

Flips, scaling, and rotation apply around the sprite's center, so they don't move it.

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
`portWidth`, `portHeight`), scaling to fit. Sub-scenes run a Scene inside another: *embedded* sub-scenes are part of the
Scene's world, and *floating* ones sit above it on the canvas, like a HUD or a dialog.

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
const target = self.toScenePosition(pointer.x, pointer.y);                     // through the camera showing it
```

Pointer positions are in canvas pixels, however the canvas is scaled on the page. A drag keeps reporting after it leaves
the canvas, touching the canvas doesn't scroll the page, and `pointer.pointers` has every touch for multi-touch.

### Audio

```ts
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
each.

## Deploying

`npm run build` puts the page, bundle, and resources in `dist/`. Upload that folder's contents. The page can be
embedded anywhere; with `scale` set, the game fits the element it's placed in.
