import { Controller, Game, Instance, SceneState } from './../../engine';
import { getRow, loseLife } from './../actors/cat';
import { HudHeight, Points, RespawnSteps, Rules, Screen, Tile } from './../constants';
import { Sprites } from './../generated/art';
import { ignorePointerThisStep } from './../input';
import { addScore, getSession } from './../session';
import { showTouchButtons } from './../settings';
import { showBanner } from './panels';

const BoxFrames = Sprites.sprBox.frames;

// steps between fish.
const FishWaitSteps = 60 * 12;

function spawnCat(self: SceneState, controller: Controller): Instance {
    const cat = self.instances.create('actCat', { x: self.state.startX, y: self.state.startY });
    self.state.cat = cat;
    self.state.bestRow = getRow(cat);
    getSession(controller).timeLeft = Rules.timeSteps;
    self.defaultCamera.follow(cat, { centerOnTarget: true });
    return cat;
}

// Shows points floating up from where they were scored.
function showPoints(self: SceneState, x: number, y: number, points: number): void {
    self.instances.create('actPoints', { x: x, y: y }).state.points = points;
}

// Now and then, a fish appears in an empty box for a while.
function placeFish(self: SceneState): void {
    self.state.fishWait = (self.state.fishWait || FishWaitSteps) - 1;
    if (self.state.fishWait > 0 || self.instances.getAll('actFish').length > 0) {
        return;
    }

    const empty = self.instances.getAll('actBox').filter(box => !box.state.filled);
    if (empty.length > 1) {
        const box = empty[Math.floor(Math.random() * empty.length)];
        self.instances.create('actFish', { x: box.x, y: box.y });
    }
    self.state.fishWait = FishWaitSteps;
}

function isCatPlaying(self: SceneState): boolean {
    const cat: Instance | undefined = self.state.cat;
    return !!cat && !cat.state.lost && !self.state.roundOver;
}

// A cat that made it home: it curls up in the box, and the next one starts out.
function fillBox(self: SceneState, cat: Instance, controller: Controller): void {
    const box = self.instances.getAll('actBox').find(box => Math.abs(box.x - cat.x) < 4);
    if (!box) {
        return;
    }

    box.state.filled = true;
    box.animation.setFrame(BoxFrames.cat);
    cat.destroy();
    self.state.cat = undefined;

    const secondsLeft = Math.floor(getSession(controller).timeLeft * controller.stepDurationMs / 1000);
    let points = Points.box + secondsLeft * Points.secondLeft;

    const fish = self.instances.getAll('actFish').find(fish => fish.x === box.x);
    if (fish) {
        fish.destroy();
        points += Points.fish;
        controller.audio.play('sndBonus');
    }

    addScore(controller, points);
    showPoints(self, box.x, box.y + Tile, points);
    controller.publishEvent('boxFilled');

    const boxes = self.instances.getAll('actBox');
    const allFilled = boxes.every(box => box.state.filled);
    controller.audio.play(allFilled ? 'sndRoundClear' : 'sndBox');

    if (allFilled) {
        // every box is full: on to a faster round.
        addScore(controller, Points.allBoxes);
        self.state.roundOver = true;
        controller.publishEvent('roundCleared', { round: getSession(controller).round });
        showBanner(self, `ROUND ${getSession(controller).round + 1}`, RespawnSteps * 2);

        self.startTimer({ durationSteps: RespawnSteps * 2 }).onEnd(() => {
            getSession(controller).round++;
            boxes.forEach(box => {
                box.state.filled = false;
                box.animation.setFrame(BoxFrames.empty);
            });
            self.state.roundOver = false;
            spawnCat(self, controller);
        });
    }
    else {
        spawnCat(self, controller);
    }
}

// A lost life: the cat stays where it was for a moment, floats away as a ghost, and the next cat starts out.
function loseCat(self: SceneState, cat: Instance, controller: Controller): void {
    const session = getSession(controller);
    session.lives--;

    self.startTimer({ durationSteps: RespawnSteps / 2 }).onEnd(() => {
        self.instances.create('actGhost', { x: cat.x, y: cat.y });
        cat.destroy();
    });

    self.startTimer({ durationSteps: RespawnSteps * 1.5 }).onEnd(() => {
        if (session.lives > 0) {
            spawnCat(self, controller);
        }
        else {
            self.state.gameOver = true;
            self.floatSubScene('scnGameOver', { width: Screen.width, height: Screen.height, depth: -10 });
            controller.audio.play('sndGameOver');
            controller.publishEvent('gameOver');
        }
    });
}

// Pausing floats a panel over the level. The tap that resumes isn't also a hop.
function togglePause(self: SceneState, controller: Controller): void {
    if (self.state.gameOver) {
        return;
    }

    if (self.state.pausePanel) {
        self.state.pausePanel.destroy();
        self.state.pausePanel = undefined;
        ignorePointerThisStep(controller);
    }
    else {
        self.state.pausePanel = self.floatSubScene('scnPause', { width: Screen.width, height: Screen.height, depth: -10 });
    }
    self.paused = !!self.state.pausePanel;
}

export function buildLevel(game: Game): void {
    const font = game.construction.fonts.get('fntPixel');
    const map = game.construction.tileMaps.get('mapLevel');
    const level = game.construction.scenes.add('scnLevel', { width: map.pixelWidth, height: map.pixelHeight });
    level.background.setFromTileMap(map, ['Ground']);

    level.onStart((self, controller) => {
        self.instances.createFromTileLayer(map, 'Walls', 'actWall');
        self.instances.createFromTileLayer(map, 'Water', 'actWater');
        self.instances.createFromTileMapObjects(map, 'Lanes');

        // the map's cat marks where each cat starts out.
        const start = self.instances.createFromTileMapObjects(map, 'Actors').find(instance => instance.actor.name === 'actCat')!;
        self.state.startX = start.x;
        self.state.startY = start.y;
        start.destroy();
        spawnCat(self, controller);

        // the camera shows the level below the HUD.
        const camera = self.defaultCamera;
        camera.width = camera.portWidth = Screen.width;
        camera.height = camera.portHeight = Screen.height - HudHeight;
        camera.portY = HudHeight;

        self.floatSubScene('scnHud', { x: 0, y: 0, width: Screen.width, height: HudHeight });
        showBanner(self, `ROUND ${getSession(controller).round}`, RespawnSteps * 1.5);
        showTouchButtons(controller, true, font);
    });

    level.onKeyboardInput('p', (self, event, controller) => {
        if (event.type === 'keydown' && !event.repeat) {
            togglePause(self, controller);
        }
    });

    level.onKeyboardInput('Escape', (self, event, controller) => {
        if (event.type === 'keydown' && !event.repeat && self.state.pausePanel) {
            togglePause(self, controller);
        }
    });

    level.onGameEvent('togglePause', (self, event, controller) => togglePause(self, controller));

    level.onGameEvent('gameOver', (self, event, controller) => showTouchButtons(controller, false, font));

    level.onStep((self, controller) => {
        const cat: Instance | undefined = self.state.cat;
        if (!cat || !isCatPlaying(self)) {
            return;
        }

        placeFish(self);

        const session = getSession(controller);
        session.timeLeft--;

        // ticks each second as time runs out.
        const stepsPerSecond = Math.round(1000 / controller.stepDurationMs);
        if (session.timeLeft < Rules.timeSteps / 4 && session.timeLeft % stepsPerSecond === 0) {
            controller.audio.play('sndTick');
        }

        if (session.timeLeft <= 0) {
            loseLife(cat, controller, 'timeUp');
        }
    });

    level.onGameEvent('catLanded', (self, event, controller) => {
        const cat: Instance = event.data.cat;
        if (cat !== self.state.cat || cat.state.lost) {
            return;
        }

        // points for each row closer to home than this cat has been.
        if (event.data.row < self.state.bestRow) {
            addScore(controller, (self.state.bestRow - event.data.row) * Points.row);
            self.state.bestRow = event.data.row;
        }

        if (event.data.row === 1) {
            fillBox(self, cat, controller);
        }
    });

    level.onGameEvent('catLost', (self, event, controller) => {
        loseCat(self, event.data.cat, controller);
    });
}
