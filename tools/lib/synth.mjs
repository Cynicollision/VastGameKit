// A tiny chiptune synthesizer: voices of square, triangle, or noise waves, sliding in pitch and fading, mixed together
// and saved as 8-bit WAV files, like the sound chips of old consoles.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const SampleRate = 22050;

const NoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A note's frequency, e.g. note('A4') is 440.
export function note(name) {
    const match = /^([A-G]#?)(\d)$/.exec(name);
    if (!match) {
        throw new Error(`Not a note: ${name}`);
    }
    const semitone = NoteNames.indexOf(match[1]) + (Number(match[2]) + 1) * 12;
    return 440 * Math.pow(2, (semitone - 69) / 12);
}

// A voice: a wave playing from `start` for `duration` seconds.
//   wave: 'square', 'triangle', or 'noise'. duty: how much of each square wave is high (default 0.5).
//   from, to: frequency at the start and end, in Hz (for noise, how often it changes: higher is hissier).
//   volume: 0 to 1. attack: seconds to fade in. fade: how sharply it fades out, 1 is evenly (default 1).
//   vibrato: { rate, depth } in Hz and as a fraction of the frequency.
function renderVoice(voice, samples) {
    const start = Math.round((voice.start || 0) * SampleRate);
    const length = Math.round(voice.duration * SampleRate);
    const duty = voice.duty || 0.5;
    const attack = voice.attack || 0.002;
    const fade = voice.fade || 1;
    const to = voice.to !== undefined ? voice.to : voice.from;
    let phase = 0;
    let noise = 0;
    // a repeatable sequence of noise.
    let seed = 1;

    for (let i = 0; i < length && start + i < samples.length; i++) {
        const time = i / SampleRate;
        const progress = i / length;
        let frequency = voice.from * Math.pow(to / voice.from, progress);
        if (voice.vibrato) {
            frequency *= 1 + Math.sin(2 * Math.PI * voice.vibrato.rate * time) * voice.vibrato.depth;
        }

        const previousPhase = phase;
        phase = (phase + frequency / SampleRate) % 1;

        let value;
        if (voice.wave === 'square') {
            value = phase < duty ? 1 : -1;
        }
        else if (voice.wave === 'triangle') {
            value = 4 * Math.abs(phase - 0.5) - 1;
        }
        else {
            if (phase < previousPhase || i === 0) {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                noise = (seed / 0x7fffffff) * 2 - 1;
            }
            value = noise;
        }

        const envelope = time < attack ? time / attack : Math.pow(1 - progress, fade);
        samples[start + i] += value * envelope * (voice.volume !== undefined ? voice.volume : 1);
    }
}

// Notes one after another: each [name, beats], or [null, beats] for a rest.
export function melody(notes, options) {
    const voices = [];
    let time = options.start || 0;
    for (const [name, beats] of notes) {
        const duration = beats * options.beat;
        if (name) {
            voices.push({ ...options, start: time, duration: duration, from: note(name), to: note(name) });
        }
        time += duration;
    }
    return voices;
}

export function render(voices) {
    const length = Math.max(...voices.map(voice => (voice.start || 0) + voice.duration));
    const samples = new Float32Array(Math.ceil(length * SampleRate));
    voices.forEach(voice => renderVoice(voice, samples));
    return samples;
}

// Saves samples from -1 to 1 as an 8-bit mono WAV file.
export function saveWav(path, samples, volume = 0.5) {
    const data = Buffer.alloc(samples.length);
    samples.forEach((sample, i) => {
        data[i] = Math.round((Math.max(-1, Math.min(1, sample * volume)) + 1) * 127.5);
    });

    const header = Buffer.alloc(44);
    header.write('RIFF', 0, 'ascii');
    header.writeUInt32LE(36 + data.length, 4);
    header.write('WAVE', 8, 'ascii');
    header.write('fmt ', 12, 'ascii');
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(SampleRate, 24);
    header.writeUInt32LE(SampleRate, 28); // bytes per second
    header.writeUInt16LE(1, 32); // bytes per sample
    header.writeUInt16LE(8, 34); // bits per sample
    header.write('data', 36, 'ascii');
    header.writeUInt32LE(data.length, 40);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.concat([header, data]));
}
