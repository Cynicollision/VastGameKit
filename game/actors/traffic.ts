import { Game, Instance } from './../../engine';
import { Tile } from './../constants';
import { Sprites } from './../generated/art';
import { getSpeedMultiplier } from './../session';

const CarColors = Object.values(Sprites.sprCar.frames);
const DuckFrames = Sprites.sprDuck.frames;

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

export function buildTraffic(game: Game): void {
    buildLane(game);
    buildVehicles(game);
    buildFloaters(game);
}
