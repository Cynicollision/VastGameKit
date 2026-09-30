import { Controller, Game, Instance } from './../../engine';
import { Tile } from './../constants';
import { Sprites } from './../generated/art';
import { getSpeedMultiplier } from './../session';

const CarColors = Object.values(Sprites.sprCar.frames);
const DuckFrames = Sprites.sprDuck.frames;
const SignalFrames = Sprites.sprSignal.frames;
const TrainFrames = Sprites.sprTrain.frames;

// steps the signals flash before a train comes.
const TrainWarningSteps = 150;

// Diving ducks swim, dive, stay under, and come back up, in steps.
const DiveCycle = { swim: 240, dive: 30, under: 90, surface: 30 };

// A lane of traffic or floaters, placed in Tiled as an object across its row with properties:
//   actor: what moves along the lane.
//   speed: pixels per step, to the right, or to the left if negative.
//   count: how many groups are spaced evenly along the lane.
//   size:  how many are in each group, side by side (default 1).
//   dive:  whether the first group dives now and then (ducks).
// Everything in the lane wraps around from one side to the other, off screen.
function buildLane(game: Game): void {
    const actLane = game.construction.actors.add('actLane');

    actLane.onCreate((self, controller) => {
        const actor = game.construction.actors.get(self.state.actor);
        const width = actor.sprite ? actor.sprite.width : Tile;
        const size = self.state.size || 1;
        const sceneWidth = controller.sceneState.scene.width;

        // groups leave one side entirely before coming back on the other.
        self.state.margin = size * width + Tile;
        self.state.wrapWidth = sceneWidth + self.state.margin;
        self.state.members = [];

        for (let group = 0; group < self.state.count; group++) {
            const groupX = Math.round(group * self.state.wrapWidth / self.state.count);

            for (let i = 0; i < size; i++) {
                const member = controller.sceneState.instances.create(self.state.actor, { x: groupX + i * width, y: self.y });
                member.state.group = group;
                member.state.dives = self.state.dive && group === 0;
                member.state.variant = group + i;
                // sprites face right, except the ducks.
                member.animation.flipX = self.state.actor === 'actDuck' ? self.state.speed > 0 : self.state.speed < 0;
                self.state.members.push(member);
            }
        }
    });

    actLane.onStep((self, controller) => {
        const velocity = self.state.speed * getSpeedMultiplier(controller);
        const sceneWidth = controller.sceneState.scene.width;

        for (const member of self.state.members as Instance[]) {
            member.motion.velocityX = velocity;

            if (velocity > 0 && member.x >= sceneWidth) {
                member.x -= self.state.wrapWidth;
            }
            else if (velocity < 0 && member.x < -self.state.margin) {
                member.x += self.state.wrapWidth;
            }
        }
    });
}

function buildVehicles(game: Game): void {
    const sprites = game.construction.sprites;

    // boundaries are a little smaller than the sprites, so near misses are misses.
    const actCar = game.construction.actors.add('actCar', { sprite: sprites.get('sprCar') });
    actCar.setRectBoundary(28, 10, 2, 3);
    actCar.onCreate((self) => self.animation.setFrame(CarColors[self.state.variant % CarColors.length]));

    game.construction.actors.add('actTruck', { sprite: sprites.get('sprTruck') }).setRectBoundary(44, 10, 2, 3);
    game.construction.actors.add('actBike', { sprite: sprites.get('sprBike') }).setRectBoundary(14, 8, 1, 4);
}

function buildFloaters(game: Game): void {
    const sprites = game.construction.sprites;

    game.construction.actors.add('actCrate', { sprite: sprites.get('sprCrate') }).setRectBoundary(16, 14, 0, 1);

    const actDuck = game.construction.actors.add('actDuck', { sprite: sprites.get('sprDuck') });
    actDuck.setRectBoundary(16, 12, 0, 2);

    actDuck.onCreate((self) => {
        self.state.clock = 0;
        self.animation.start(DuckFrames.swim1, DuckFrames.swim2, 400);
    });

    actDuck.onStep((self) => {
        if (!self.state.dives) {
            return;
        }

        // all the ducks in a group were created together, so they dive together.
        const time = self.state.clock++ % (DiveCycle.swim + DiveCycle.dive + DiveCycle.under + DiveCycle.surface);
        const phase = time < DiveCycle.swim ? 'swim' : time < DiveCycle.swim + DiveCycle.dive ? 'dive' : time < DiveCycle.swim + DiveCycle.dive + DiveCycle.under ? 'under' : 'surface';

        if (phase !== self.state.phase) {
            self.state.phase = phase;
            self.state.submerged = phase === 'under';

            if (phase === 'swim') {
                self.animation.start(DuckFrames.swim1, DuckFrames.swim2, 400);
            }
            else {
                self.animation.setFrame(phase === 'under' ? DuckFrames.under : DuckFrames.dive);
            }
        }
    });
}

// A train of an engine and cars, all moving together from one side of the scene to the other.
function sendTrain(self: Instance, controller: Controller): void {
    const speed = self.state.speed * getSpeedMultiplier(controller);
    const sceneWidth = controller.sceneState.scene.width;
    const carWidth = Sprites.sprTrain.width;

    for (let i = 0; i <= self.state.cars; i++) {
        const x = speed > 0 ? -carWidth * (i + 1) : sceneWidth + carWidth * i;
        const car = controller.sceneState.instances.create('actTrain', { x: x, y: self.y });
        car.state.frame = i === 0 ? TrainFrames.engine : TrainFrames.car;
        car.state.last = i === self.state.cars;
        car.animation.flipX = speed < 0;
        car.motion.velocityX = speed;
    }

    controller.audio.play('sndTrain');
}

// A railroad track, placed in Tiled as an object across its row with properties:
//   speed:    pixels per step, to the right, or to the left if negative.
//   cars:     how many cars follow the engine.
//   interval: seconds between trains.
// Before each train, the crossing signals flash and the bell rings.
function buildRailway(game: Game): void {
    const sprites = game.construction.sprites;
    const actTrack = game.construction.actors.add('actTrack');

    actTrack.onCreate((self, controller) => {
        self.state.wait = Math.round(self.state.interval * 1000 / controller.stepDurationMs / 2);
    });

    actTrack.onStep((self, controller) => {
        self.state.wait--;

        if (self.state.wait === TrainWarningSteps) {
            controller.publishEvent('trainWarning');
        }
        if (self.state.wait > 0 && self.state.wait <= TrainWarningSteps && self.state.wait % 40 === 0) {
            controller.audio.play('sndBell');
        }
        if (self.state.wait <= 0) {
            sendTrain(self, controller);
            // trains come more often in faster rounds.
            self.state.wait = Math.round(self.state.interval * 1000 / controller.stepDurationMs / getSpeedMultiplier(controller));
        }
    });

    const actTrain = game.construction.actors.add('actTrain', { sprite: sprites.get('sprTrain') });
    actTrain.setRectBoundary(30, 12, 1, 2);
    actTrain.onCreate((self) => self.animation.setFrame(self.state.frame));
    actTrain.onStep((self, controller) => {
        const sceneWidth = controller.sceneState.scene.width;
        const gone = self.motion.velocityX > 0 ? self.x > sceneWidth : self.x < -Sprites.sprTrain.width;

        if (gone) {
            self.destroy();
            if (self.state.last) {
                controller.publishEvent('trainPassed');
            }
        }
    });

    const actSignal = game.construction.actors.add('actSignal', { sprite: sprites.get('sprSignal') });
    actSignal.onCreate((self) => self.animation.setFrame(SignalFrames.off));
    actSignal.onGameEvent('trainWarning', (self) => self.animation.start(SignalFrames.left, SignalFrames.right, 300));
    actSignal.onGameEvent('trainPassed', (self) => self.animation.setFrame(SignalFrames.off));
}

export function buildTraffic(game: Game): void {
    buildLane(game);
    buildVehicles(game);
    buildFloaters(game);
    buildRailway(game);
}
