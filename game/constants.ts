// Sizes, timings, and colors shared across the game.
export const Tile = 16;

export const Screen = {
    width: 240,
    height: 256,
};

// the HUD across the top of the screen, above the camera's view of the level.
export const HudHeight = 32;

export const Colors = {
    outline: '#1b1b2f',
    white: '#f4f4f4',
    gray: '#a3a3b3',
    red: '#e04848',
    orange: '#f59a3a',
    yellow: '#f8d860',
    green: '#58b050',
    cyan: '#7cd0f0',
};

export const Rules = {
    lives: 9,
    // steps to cross before a life is lost.
    timeSteps: 60 * 40,
    // how fast the lanes are in the first round (compared to their speeds in the map), how much faster they get each
    // round, and how fast they can get.
    firstRoundSpeed: 0.6,
    roundSpeedup: 0.1,
    topSpeed: 1.3,
    // how much of a growing lane's traffic is out in the first round (compared to its count in the map), and how much
    // more comes out each round, up to all of it. Only vehicle lanes grow: fewer floaters would make the canal harder.
    firstRoundTraffic: 0.6,
    roundTrafficGrowth: 0.1,
    // the first round that ducks dive.
    firstDivingRound: 2,
};

export const Points = {
    // for each row closer to home than the cat has been this life.
    row: 10,
    box: 50,
    // for each second left when reaching a box.
    secondLeft: 10,
    allBoxes: 1000,
    // for a box with a fish in it.
    fish: 200,
};

// steps a hop takes, the steps before a lost life's next cat appears, and the steps to celebrate a cat getting home
// before the next one does.
export const HopSteps = 6;

// steps a held key waits after a hop lands before hopping again, so it's easy to let go after one hop. Each press
// always hops, even one made during a hop.
export const HoldPauseSteps = 12;
export const RespawnSteps = 60;
export const CelebrateSteps = 45;

// how fast the camera pans back down to each new cat, in pixels per step. Faster than a hop, so it keeps up with them.
export const CameraPanSpeed = 4;
