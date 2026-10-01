import { Controller, Direction, Game, Instance, InstanceStatus, SpriteTransformation } from './../../engine';
import { HoldPauseSteps, HopSteps, Tile } from './../constants';
import { Sprites } from './../generated/art';
import { readHeld, readPress } from './../input';

const Frames = Sprites.sprCat.frames;

// what the cat can stand on in the water, and what flattens it.
export const Floaters = ['actCrate', 'actDuck'];
const Traffic = ['actCar', 'actTruck', 'actBike', 'actTrain'];

export type CatLoss = 'squashed' | 'splashed' | 'lost' | 'timeUp';

type Hop = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    step: number;
};

// The row an Instance is in, counting down from the top of the level.
export function getRow(self: Instance): number {
    return Math.round(self.y / Tile);
}

function face(self: Instance, direction: Direction): void {
    const frame = direction === Direction.Up ? Frames.up : direction === Direction.Down ? Frames.down : Frames.side;
    self.animation.setFrame(frame);
    self.animation.flipX = direction === Direction.Left;
}

// Hops look like jumps toward the camera by growing the cat, keeping which way it's flipped.
function setHopScale(self: Instance, scale: number): void {
    self.animation.setTransform(SpriteTransformation.ScaleX, self.animation.flipX ? -scale : scale);
    self.animation.setTransform(SpriteTransformation.ScaleY, scale);
}

// The box a hop up to the roof lands in, if the cat is close enough to line up with one that's empty.
function findBox(controller: Controller, x: number): Instance | undefined {
    return controller.sceneState.instances.getAll('actBox').find(box => Math.abs(box.x - x) <= Tile / 2 && !box.state.filled);
}

// Starts a hop, returning whether there was somewhere to hop to.
function startHop(self: Instance, direction: Direction, controller: Controller): boolean {
    face(self, direction);

    const scene = controller.sceneState.scene;
    const toY = self.y + (direction === Direction.Up ? -Tile : direction === Direction.Down ? Tile : 0);
    let toX = self.x + (direction === Direction.Left ? -Tile : direction === Direction.Right ? Tile : 0);

    if (toX < 0 || toX > scene.width - Tile || toY < Tile || toY > scene.height - Tile) {
        return false;
    }

    // the roof is a wall except where the boxes are.
    if (Math.round(toY / Tile) === 1) {
        const box = findBox(controller, toX);
        if (!box) {
            return false;
        }
        toX = box.x;
    }

    if (!self.isPlaceFree(toX, toY)) {
        return false;
    }

    self.state.hop = { fromX: self.x, fromY: self.y, toX: toX, toY: toY, step: 0 };
    controller.audio.play('sndHop');
    return true;
}

// Moves along the hop, and lands at its end.
function continueHop(self: Instance, hop: Hop, controller: Controller): void {
    hop.step++;
    const progress = hop.step / HopSteps;
    self.x = Math.round(hop.fromX + (hop.toX - hop.fromX) * progress);
    self.y = Math.round(hop.fromY + (hop.toY - hop.fromY) * progress);
    setHopScale(self, 1 + 0.25 * Math.sin(Math.PI * progress));

    if (hop.step >= HopSteps) {
        self.state.hop = undefined;
        self.state.restSteps = 0;
        setHopScale(self, 1);
        controller.publishEvent('catLanded', { cat: self, row: getRow(self) });
    }
}

// Moves with whatever the cat is riding, including partway through a hop.
function ride(self: Instance): void {
    const floater: Instance | undefined = self.state.ride;
    if (!floater || floater.status === InstanceStatus.Destroyed) {
        return;
    }

    const moved = floater.x - self.state.rideX;
    self.state.rideX = floater.x;
    // floaters wrap around far off screen, where the cat can't follow.
    if (Math.abs(moved) < Tile) {
        self.x += moved;
        const hop: Hop | undefined = self.state.hop;
        if (hop) {
            hop.fromX += moved;
            hop.toX += moved;
        }
    }
}

// Between hops, the cat needs something to stand on in the water, and to stay on screen.
function checkFooting(self: Instance, controller: Controller): void {
    const centerX = self.x + Tile / 2;
    const centerY = self.y + Tile / 2;
    const underfoot = controller.sceneState.instances.getAtPosition(centerX, centerY);
    const floater = underfoot.find(instance => Floaters.includes(instance.actor.name) && !instance.state.submerged);

    if (floater) {
        if (self.state.ride !== floater) {
            self.state.ride = floater;
            self.state.rideX = floater.x;
        }
    }
    else {
        self.state.ride = undefined;
        if (underfoot.some(instance => instance.actor.name === 'actWater')) {
            loseLife(self, controller, 'splashed');
            return;
        }
    }

    if (centerX < 0 || centerX > controller.sceneState.scene.width) {
        loseLife(self, controller, 'lost');
    }
}

// Stops the cat where it is and shows how it lost a life. The level takes it from there.
export function loseLife(self: Instance, controller: Controller, how: CatLoss): void {
    if (self.state.lost) {
        return;
    }

    self.state.lost = how;
    self.state.hop = undefined;
    self.state.ride = undefined;
    setHopScale(self, 1);
    self.animation.flipX = false;

    if (how === 'splashed') {
        self.setSprite(controller.gameConstruction.sprites.get('sprSplash'));
        self.animation.start(0, 2, 150, { loop: false });
    }
    else {
        self.animation.setFrame(Frames.squashed);
    }

    controller.audio.play(how === 'squashed' ? 'sndSquish' : how === 'splashed' ? 'sndSplash' : 'sndTimeUp');
    controller.publishEvent('catLost', { cat: self, how: how });
}

export function buildCat(game: Game): void {
    const actCat = game.construction.actors.add('actCat', { sprite: game.construction.sprites.get('sprCat') });
    // smaller than the sprite, so near misses are misses.
    actCat.setRectBoundary(10, 10, 3, 4);

    actCat.onCreate((self) => {
        self.depth = -10;
        face(self, Direction.Up);
    });

    actCat.onStep((self, controller) => {
        if (self.state.lost) {
            return;
        }

        ride(self);

        // a press during a hop waits for it to land.
        const pressed = readPress(controller);
        if (pressed !== undefined) {
            self.state.nextHop = pressed;
        }

        const hop: Hop | undefined = self.state.hop;
        if (hop) {
            continueHop(self, hop, controller);
        }
        else if (self.state.nextHop !== undefined) {
            // bonks for presses that can't hop, but not over and over for a held key.
            if (!startHop(self, self.state.nextHop, controller)) {
                controller.audio.play('sndBonk');
            }
            self.state.nextHop = undefined;
        }
        else {
            self.state.restSteps = (self.state.restSteps || 0) + 1;
            const held = readHeld(controller);
            if (held !== undefined && self.state.restSteps > HoldPauseSteps) {
                startHop(self, held, controller);
            }
        }

        if (!self.state.hop && !self.state.lost) {
            checkFooting(self, controller);
        }
    });

    for (const actorName of Traffic) {
        actCat.onCollision(actorName, (self, other, controller) => loseLife(self, controller, 'squashed'));
    }
}
