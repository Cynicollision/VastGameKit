// The game's sound effects, each a list of voices (see tools/lib/synth.mjs).
import { melody, note } from '../lib/synth.mjs';

export const Effects = {
    // a quick rising blip for each hop.
    sndHop: [
        { wave: 'square', duty: 0.5, duration: 0.06, from: 300, to: 620, volume: 0.5, fade: 2 },
    ],
    // a hop into a wall.
    sndBonk: [
        { wave: 'square', duty: 0.25, duration: 0.07, from: 140, to: 90, volume: 0.5 },
    ],
    // flattened: a crunch and a falling tone.
    sndSquish: [
        { wave: 'noise', duration: 0.12, from: 4000, to: 1500, volume: 0.6, fade: 2 },
        { wave: 'square', duty: 0.25, duration: 0.3, from: 400, to: 70, volume: 0.5, start: 0.03 },
    ],
    // into the water: a splash that settles.
    sndSplash: [
        { wave: 'noise', duration: 0.45, from: 9000, to: 1200, volume: 0.7, fade: 1.5 },
        { wave: 'triangle', duration: 0.2, from: 600, to: 150, volume: 0.6 },
    ],
    // out of time: a sad slide down.
    sndTimeUp: [
        { wave: 'square', duty: 0.5, duration: 0.5, from: 500, to: 180, volume: 0.4, vibrato: { rate: 8, depth: 0.03 } },
    ],
    // a warning tick each second when time is running out.
    sndTick: [
        { wave: 'square', duty: 0.125, duration: 0.03, from: 1800, volume: 0.35 },
    ],
    // a cat home in its box: a happy arpeggio.
    sndBox: melody([['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2]], { wave: 'square', duty: 0.25, beat: 0.055, volume: 0.45, fade: 0.5 }),
    // every box full.
    sndRoundClear: [
        ...melody([['G4', 1], ['C5', 1], ['E5', 1], ['G5', 2], ['E5', 1], ['G5', 4]], { wave: 'square', duty: 0.25, beat: 0.09, volume: 0.4, fade: 0.5 }),
        ...melody([['C4', 2], ['E4', 2], ['G4', 2], ['C5', 4]], { wave: 'triangle', beat: 0.09, volume: 0.5, fade: 0.5 }),
    ],
    sndGameOver: [
        ...melody([['G4', 2], ['E4', 2], ['C4', 2], ['G3', 6]], { wave: 'square', duty: 0.5, beat: 0.12, volume: 0.35, fade: 0.7, vibrato: { rate: 6, depth: 0.01 } }),
        ...melody([['C3', 6], ['G2', 6]], { wave: 'triangle', beat: 0.12, volume: 0.5, fade: 0.7 }),
    ],
    // starting a game: a synthesized meow, rising and falling.
    sndMeow: [
        { wave: 'square', duty: 0.25, duration: 0.14, from: note('E5'), to: note('B5'), volume: 0.35, attack: 0.03 },
        { wave: 'square', duty: 0.25, duration: 0.26, from: note('B5'), to: note('F#5'), volume: 0.35, start: 0.14, vibrato: { rate: 12, depth: 0.02 } },
        { wave: 'triangle', duration: 0.4, from: note('E4'), to: note('D4'), volume: 0.3 },
    ],
    // changing a setting.
    sndSelect: [
        { wave: 'square', duty: 0.5, duration: 0.05, from: note('B5'), volume: 0.35 },
        { wave: 'square', duty: 0.5, duration: 0.12, from: note('E6'), volume: 0.35, start: 0.05 },
    ],
};
