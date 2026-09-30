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
    // how much faster the lanes are each round.
    roundSpeedup: 0.15,
};

export const Points = {
    // for each row closer to home than the cat has been this life.
    row: 10,
    box: 50,
    // for each second left when reaching a box.
    secondLeft: 10,
    allBoxes: 1000,
};

// steps a hop takes, and the steps before a lost life's next cat appears.
export const HopSteps = 6;
export const RespawnSteps = 60;
