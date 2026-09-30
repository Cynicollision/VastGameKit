import { GameError } from './../engine/core';
import { GameAudio } from './../engine/device/audio';
import { Sound } from './../engine/resources/sound';
import { GameConstruction } from './../engine/structure/construction';

// a silent mono 16 bit PCM WAV file.
function wavDataUri(seconds: number, sampleRate: number = 8000): string {
    const samples = Math.round(seconds * sampleRate);
    const view = new DataView(new ArrayBuffer(44 + samples * 2));
    const writeString = (offset: number, value: string): void => value.split('').forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    const bytes = new Uint8Array(view.buffer);
    return `data:audio/wav;base64,${btoa(String.fromCharCode(...Array.from(bytes)))}`;
}

describe('Sound', () => {
    let context: AudioContext;

    beforeEach(() => {
        context = new AudioContext();
    });

    afterEach(() => context.close());

    it('fetches and decodes its source', async () => {
        const sound = Sound.new('sndTest', { source: wavDataUri(0.5), volume: 0.5 });
        expect(sound.loaded).toBeFalse();

        await sound.load(context);

        expect(sound.loaded).toBeTrue();
        expect(sound.buffer!.duration).toBeCloseTo(0.5, 1);
        expect(sound.volume).toBe(0.5);
    });

    it('stays unloaded without an audio context', async () => {
        const sound = Sound.new('sndTest', { source: wavDataUri(0.1) });

        await sound.load(undefined);

        expect(sound.loaded).toBeFalse();
    });

    it('rejects with a GameError when its source is missing', async () => {
        const sound = Sound.new('sndMissing', { source: '/missing.wav' });

        await expectAsync(sound.load(context)).toBeRejectedWithError(GameError, /sndMissing/);
    });
});

describe('GameAudio', () => {
    let construction: GameConstruction;
    let audio: GameAudio;

    beforeEach(async () => {
        construction = new GameConstruction();
        construction.sounds.add('sndShort', { source: wavDataUri(0.05) });
        construction.sounds.add('sndLong', { source: wavDataUri(2) });
        construction.sounds.add('sndMusic', { source: wavDataUri(1) });

        audio = new GameAudio(construction);
        await construction.load(audio.context);
    });

    afterEach(() => audio.context!.close());

    it('plays Sounds and reports when they end', async () => {
        await audio.unlock();
        const playback = audio.play('sndShort', { volume: 0.5, pan: -1, rate: 2 })!;

        expect(playback.playing).toBeTrue();
        expect(playback.volume).toBe(0.5);

        const deadline = Date.now() + 2000;
        while (playback.playing && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        expect(playback.playing).toBeFalse();
    });

    it('stops Sounds', async () => {
        await audio.unlock();
        const playback = audio.play('sndLong', { loop: true })!;

        playback.stop();

        expect(playback.playing).toBeFalse();
    });

    it('skips Sounds while locked, and starts music once unlocked', async () => {
        await audio.context!.suspend();

        expect(audio.unlocked).toBeFalse();
        expect(audio.play('sndShort')).toBeUndefined();
        expect(audio.playMusic('sndMusic')).toBeUndefined();
        expect(audio.musicName).toBe('sndMusic');

        await audio.unlock();

        const music = audio.playMusic('sndMusic')!;
        expect(music.playing).toBeTrue();
        expect(music.sound.name).toBe('sndMusic');
    });

    it('keeps the same music playing, and replaces different music', async () => {
        await audio.unlock();
        const music = audio.playMusic('sndMusic')!;

        expect(audio.playMusic('sndMusic')).toBe(music);

        const otherMusic = audio.playMusic('sndLong')!;
        expect(music.playing).toBeFalse();
        expect(otherMusic.playing).toBeTrue();
        expect(audio.musicName).toBe('sndLong');

        audio.stopMusic();
        expect(otherMusic.playing).toBeFalse();
        expect(audio.musicName).toBeUndefined();
    });

    it('stops all audio', async () => {
        await audio.unlock();
        const music = audio.playMusic('sndMusic')!;
        const sound = audio.play('sndLong')!;

        audio.stopAll();

        expect([music.playing, sound.playing]).toEqual([false, false]);
    });

    it('does nothing when audio is unsupported', async () => {
        const unsupported = new GameAudio(construction, () => undefined);

        await unsupported.unlock();

        expect(unsupported.context).toBeUndefined();
        expect(unsupported.unlocked).toBeFalse();
        expect(unsupported.play('sndShort')).toBeUndefined();
        expect(unsupported.playMusic('sndMusic')).toBeUndefined();
        unsupported.muted = true;
        unsupported.stopAll();
    });
});
