import { Controller, Game, Instance, SceneState } from './../../engine';
import { getRow, loseLife } from './../actors/cat';
import { HudHeight, Points, RespawnSteps, Rules, Screen } from './../constants';
import { Sprites } from './../generated/art';
import { addScore, getSession } from './../session';

const BoxFrames = Sprites.sprBox.frames;

function spawnCat(self: SceneState, controller: Controller): Instance {
    const cat = self.instances.create('actCat', { x: self.state.startX, y: self.state.startY });
    self.state.cat = cat;
    self.state.bestRow = getRow(cat);
    getSession(controller).timeLeft = Rules.timeSteps;
    self.defaultCamera.follow(cat, { centerOnTarget: true });
    return cat;
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
    addScore(controller, Points.box + secondsLeft * Points.secondLeft);
    controller.publishEvent('boxFilled');

    const boxes = self.instances.getAll('actBox');
    if (boxes.every(box => box.state.filled)) {
        // every box is full: on to a faster round.
        addScore(controller, Points.allBoxes);
        self.state.roundOver = true;
        controller.publishEvent('roundCleared', { round: getSession(controller).round });

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
            controller.publishEvent('gameOver');
        }
    });
}

export function buildLevel(game: Game): void {
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
    });

    level.onStep((self, controller) => {
        const cat: Instance | undefined = self.state.cat;
        if (!cat || !isCatPlaying(self)) {
            return;
        }

        const session = getSession(controller);
        session.timeLeft--;
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
