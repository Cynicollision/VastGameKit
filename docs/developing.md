# Developing the engine

Notes for working on VastGameKit itself: the engine, its tests, and Nine Lives. For using the engine in a game, see
[Making a game](making-a-game.md).

- [Getting started](#getting-started)
- [How the code is organized](#how-the-code-is-organized)
- [Testing](#testing)
- [Changing the engine](#changing-the-engine)
- [Nine Lives](#nine-lives)
- [Releasing](#releasing)

## Getting started

You need Node 24 (what CI uses) and Chrome, which runs the tests.

```sh
npm install      # also builds the engine into lib/, as a game's install would
npm run debug    # Nine Lives at http://localhost:9000, rebuilt as you edit
npm test         # run the tests once in headless Chrome (npm run test:watch to keep watching)
npm run lint
npm run build    # a production build of Nine Lives in dist/, ready to upload
```

| Script | |
| --- | --- |
| `debug` | the webpack dev server for Nine Lives, at http://localhost:9000, with hot reloading |
| `build` | a production build of Nine Lives: the bundle, page, and resources in `dist/` |
| `build:dev` | a development build of Nine Lives, written next to its page in `game/` |
| `build:lib` | compiles the engine to `lib/` with type declarations, for games that depend on it |
| `test` / `test:watch` | the tests, in headless Chrome |
| `lint` | ESLint over the engine, Nine Lives, and the tools (not the tests) |
| `art` | redraws Nine Lives' images from `tools/art/` |
| `sfx` | synthesizes Nine Lives' sound effects from `tools/sounds/` |

In VS Code, the **Debug Chrome** launch configuration starts the dev server and opens Nine Lives in Chrome with
breakpoints in the TypeScript.

CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs on pushes to `main` and on pull requests:
`npm ci` (which builds `lib/`), lint, a type check of everything (`npx tsc --noEmit -p .`), the tests, and the
production build. Run the type check locally too: webpack only checks files in the bundle, so errors in tests can slip
past `npm run debug`.

## How the code is organized

```
engine/
├── index.ts      everything games can import, re-exported from the folders below
├── game.ts       Game: init, load, start, the frame loop, pause and resume
├── structure/    Construction: Actors, Scenes, and the registries that hold them
├── state/        State: Instances, SceneStates, the Controller, cameras, sub-scenes, motion, transitions
├── resources/    loaded things: sprites and their animation, sounds, bitmap fonts, tile maps, backgrounds
├── device/       the browser: canvas, keyboard, pointer, touch controls, audio, storage
└── core/         shared basics: boundaries, the spatial grid, the fixed-step clock, timers, events, geometry
```

The split between Construction (`structure/`, what a game *is*) and State (`state/`, what's happening while it runs) is
the engine's central idea; [Making a game](making-a-game.md#how-a-game-is-put-together) describes it from a game's side.
Interfaces like `Actor`, `Scene`, `Instance`, and `Controller` are what games see; the classes behind them
(`ActorDefinition`, `GameScene`, `ActorInstance`, `SceneController`) have the extra methods the engine calls.

### A frame

`Game.start` requests animation frames. On each, `Game.frame` asks the `FixedStepClock` how many steps are due (at
most 10, so a slow frame doesn't snowball), runs them, then draws once.

Each step, in `SceneController.step`:

1. the keyboard and pointer move on a step (so `wasPressed` means "since the previous step")
2. Controller timers tick, and a scene transition advances
3. game events published since the last step are delivered
4. the current SceneState steps: floating sub-scenes, then (unless paused) its timers, the Scene's `onStep`, its
   Instances, embedded sub-scenes, and following cameras

Each Instance, in `SceneInstanceState.step`, is either removed (if destroyed, calling `onDestroy`), activated (if new,
calling `onCreate`), or stepped: `onStep`, then motion, following, animation, and collisions. Instances created during
a step are first stepped on the next.

Input arrives between steps from the browser's events: `GameInputHandler` passes keyboard and pointer events to the
Controller, which updates `controller.keyboard` and `controller.pointer` and calls the `onKeyboardInput` and
`onPointerInput` callbacks right away.

Drawing goes through `GameCanvas`, the interface over the 2D canvas context (tests use a mock). Each camera pushes a
view (a transform and clip), draws the background, embedded sub-scenes, and the Instances it can see, then pops it;
then the Scene's `onDraw`, floating sub-scenes, touch controls, and any transition draw over everything.

## Testing

The tests are Jasmine specs in `test/`, run by Karma in headless Chrome and bundled by the same webpack config as the
game. Chrome is started with `--autoplay-policy=no-user-gesture-required` so audio tests can start audio.

- `TestUtil.getTestGame()` makes a Game with a `MockGameCanvas` (which records what's drawn) and input handlers on
  detached elements, so tests don't need a page.
- Images are data URIs (`test/mocks/testImages.ts`) and Tiled maps are inline strings, so tests don't load files.
- Tests move the game along by calling `step()` directly, rather than waiting on real time.
  `gameScenarios.spec.ts` checks patterns games rely on end to end, like restarting a level by going to its own
  Scene.

To focus on one spec while working, use `fdescribe` or `fit` with `npm run test:watch`, and remove it after.

## Changing the engine

Some principles the engine has settled on:

- **Keep the concepts.** Construction and State, Actors and Instances, Scenes and SceneStates, sub-scenes, cameras, and
  lifecycle callbacks are the engine. Fix and fill in around them rather than redesigning them.
- **Built-ins, not plugins.** Features like motion, transitions, and touch controls are part of the engine rather than
  pluggable layers, which keeps it simple and fast. (An earlier `ext/` layer of pluggable behaviors was folded in.)
- **Code first.** Games are defined in code; Tiled is an optional editor for maps, read directly from `.tmx` and `.tsx`.
  (A JSON game manifest was tried and shelved on the `shelf/game-manifest` branch.)
- **Steps, not milliseconds.** Anything that takes time counts steps, so the game behaves the same at any frame rate.
- **Everything through `engine/index.ts`.** Add new modules' exports there; games and Nine Lives import only from it.

With each change:

- Add or update tests, especially for bug fixes.
- Update [Making a game](making-a-game.md) for anything a game would use or notice.
- Check Nine Lives still plays (`npm run debug`). It uses most of the engine, so it's the quickest end-to-end check.

To try a change in a game in its own repo before releasing it, point the game at this folder
(`"vastgame": "file:../VastGameKit"`), and run `npm run build:lib` here after each change, since games use the built
`lib/`.

Known loose ends are marked with `TODO` comments in the engine, e.g. `Scene.placeActor` has no tests, and `Game.init`
logs to the console rather than a game log.

## Nine Lives

Nine Lives is the engine's demo and a real game, published on [seannormoyle.net](https://seannormoyle.net/games/nine-lives/).

```
game/
├── main.ts         defines resources and loads them, then builds every Actor and Scene
├── index.html      the page
├── constants.ts    the screen, colors, and Rules: lane speeds, how they grow by round, scoring, timings
├── session.ts      the state of one play-through: score, lives, round
├── settings.ts     sound and touch settings, saved in storage
├── input.ts        keyboard and touch controls
├── text.ts         drawing text in the bitmap font
├── actors/         the cat, traffic and floaters, and scenery
├── scenes/         the title, level, HUD, and panels (pause, game over, banners)
├── generated/      written by the tools below; don't edit
└── resources/      images, sounds, and Tiled maps
```

Tuning the game's difficulty mostly happens in `Rules` in `constants.ts`, and in the lanes' custom properties in
`resources/maps/level.tmx`.

Where it uses each part of the engine, to check after changing one:

| Feature | In Nine Lives |
| --- | --- |
| Tiled maps | `resources/maps/level.tmx` and `title.tmx`: tile layers for the background, walls, and water; objects for the cat, boxes, signals, and lanes, with lane speeds and spacing as custom properties |
| Cameras and sub-scenes | the camera follows the cat up the level, panning back down when it starts over; the HUD, pause and game over panels, and round banners float over it (`scenes/`) |
| Motion and collision | traffic and floaters wrap around their lanes; the cat rides crates and ducks and is flattened by traffic (`actors/`) |
| Sprites | animation, flips, hop scaling, fading ghosts, and switching to a splash sprite |
| Text | a bitmap font for all text, and a logo drawn from it |
| Input | arrow keys and WASD (held keys pause between hops), a touch d-pad on the side picked when starting by touch, and a tappable HUD (`input.ts`, `settings.ts`) |
| Audio, timers, events, storage | sound effects (off until turned on), respawns and trains on timers, game events between the level, HUD, and actors, and saved high scores and settings |

### Art and sound

Every image and sound is generated, so there are no third-party assets. Keep it that way: `npm run build` copies
everything in `game/resources/` to `dist/`, so anything left there gets published, even if git ignores it.

- **Images** are drawn as text in `tools/art/`, each character a color from `tools/art/palette.mjs` (sprites in
  `sprites.mjs`, tiles in `tiles.mjs`, the font in `font.mjs`, the logo in `logo.mjs`). `npm run art` writes the PNGs
  and the tileset's `.tsx` to `game/resources/`, and the sprites' sizes and the font's characters to
  `game/generated/art.ts`. Add `-- --preview <folder>` to also save copies scaled up 4x to look at.
- **Sound effects** are lists of chiptune voices in `tools/sounds/effects.mjs`, rendered by `tools/lib/synth.mjs`.
  `npm run sfx` writes the WAVs to `game/resources/sounds/`, and their names to `game/generated/sounds.ts`.
- **Maps** (`game/resources/maps/level.tmx` and `title.tmx`) are edited in Tiled, and are source files themselves.

Commit the generated files along with the scripts that made them.

### Publishing it

`npm run build`, then copy the contents of `dist/` to `games/nine-lives/play/` in the website's repo, through a pull
request there. Before that, the production build can be checked locally by serving `dist/`, e.g.
`python -m http.server 9001 --directory dist`.

## Releasing

Games depend on a git tag of this repo, and installing one runs the `prepare` script, which builds `lib/` from the
tagged source. So a release is a tag on a commit where CI passes:

1. Update `version` in `package.json` (following semver: a new major version for changes that break games).
2. Commit, then tag the commit with the same version and push the tag:

   ```sh
   git tag v1.1.0
   git push origin v1.1.0
   ```

3. In each game, change the tag in its `vastgame` dependency, `npm install`, and check it still plays.
