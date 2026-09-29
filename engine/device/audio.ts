import { Sound } from './../resources/sound';
import { GameConstruction } from './../structure/construction';

export type PlayOptions = {
    // multiplies the Sound's volume. Default 1.
    volume?: number;
    // from -1 (left) to 1 (right). Default 0.
    pan?: number;
    // Default false, or true for music.
    loop?: boolean;
    // playback speed, which also changes the pitch. Default 1.
    rate?: number;
};

// A playing Sound.
export class SoundPlayback {
    readonly sound: Sound;

    private readonly source: AudioBufferSourceNode;
    private readonly gain: GainNode;
    private onEndCallback?: () => void;

    private _playing = true;
    get playing() { return this._playing; }

    private _volume: number;
    get volume() { return this._volume; }
    set volume(value: number) {
        this._volume = value;
        this.gain.gain.value = this.sound.volume * value;
    }

    constructor(sound: Sound, source: AudioBufferSourceNode, gain: GainNode, volume: number, onEnd: () => void) {
        this.sound = sound;
        this.source = source;
        this.gain = gain;
        this._volume = volume;
        this.gain.gain.value = sound.volume * volume;
        this.onEndCallback = onEnd;

        source.addEventListener('ended', () => this.end());
    }

    private end(): void {
        this._playing = false;

        if (this.onEndCallback) {
            const callback = this.onEndCallback;
            this.onEndCallback = undefined;
            callback();
        }
    }

    stop(): void {
        if (this._playing) {
            this.source.stop();
            this.end();
        }
    }
}

type AudioGraph = {
    context: AudioContext;
    master: GainNode;
    music: GainNode;
    sounds: GainNode;
};

// Plays Sounds on two channels, sounds and music, each with its own volume.
// Browsers only allow audio to start after the player interacts with the page, so audio is locked until then (see
// unlockOnUserGesture). Sounds played while locked are skipped, and music starts once unlocked.
export class GameAudio {
    private readonly construction: GameConstruction;
    private readonly createContext: () => AudioContext | undefined;
    private readonly playbacks = new Set<SoundPlayback>();

    // undefined until first used, and null if audio isn't supported.
    private graph?: AudioGraph | null;
    private music?: SoundPlayback;
    private pendingMusic?: { soundName: string; options: PlayOptions };
    private suspended = false;

    private _muted = false;
    get muted() { return this._muted; }
    set muted(value: boolean) {
        this._muted = value;
        this.applyVolume();
    }

    private _volume = 1;
    // the volume of all audio, from 0 to 1.
    get volume() { return this._volume; }
    set volume(value: number) {
        this._volume = value;
        this.applyVolume();
    }

    private _musicVolume = 1;
    get musicVolume() { return this._musicVolume; }
    set musicVolume(value: number) {
        this._musicVolume = value;
        this.applyVolume();
    }

    private _soundVolume = 1;
    get soundVolume() { return this._soundVolume; }
    set soundVolume(value: number) {
        this._soundVolume = value;
        this.applyVolume();
    }

    // the audio context, created when first used, or undefined if audio isn't supported.
    get context(): AudioContext | undefined {
        const graph = this.getGraph();
        return graph ? graph.context : undefined;
    }

    // whether audio can play.
    get unlocked(): boolean {
        const graph = this.getGraph();
        return graph !== null && graph.context.state === 'running';
    }

    // the name of the music playing or waiting to play.
    get musicName(): string | undefined {
        if (this.pendingMusic) {
            return this.pendingMusic.soundName;
        }
        return this.music && this.music.playing ? this.music.sound.name : undefined;
    }

    constructor(construction: GameConstruction, createContext: () => AudioContext | undefined = GameAudio.createDefaultContext) {
        this.construction = construction;
        this.createContext = createContext;
    }

    private static createDefaultContext(): AudioContext | undefined {
        return typeof AudioContext !== 'undefined' ? new AudioContext() : undefined;
    }

    private applyVolume(): void {
        if (this.graph) {
            this.graph.master.gain.value = this._muted ? 0 : this._volume;
            this.graph.music.gain.value = this._musicVolume;
            this.graph.sounds.gain.value = this._soundVolume;
        }
    }

    private getGraph(): AudioGraph | null {
        if (this.graph === undefined) {
            const context = this.createContext();

            if (context) {
                const master = context.createGain();
                const music = context.createGain();
                const sounds = context.createGain();
                master.connect(context.destination);
                music.connect(master);
                sounds.connect(master);

                this.graph = { context: context, master: master, music: music, sounds: sounds };
                this.applyVolume();
                context.addEventListener('statechange', () => this.startPendingMusic());
            }
            else {
                this.graph = null;
            }
        }

        return this.graph;
    }

    private start(soundName: string, channel: GainNode, options: PlayOptions, defaultLoop: boolean): SoundPlayback | undefined {
        const graph = this.graph!;
        const sound = this.construction.sounds.get(soundName);

        if (!sound.buffer) {
            return undefined;
        }

        const source = graph.context.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = options.loop !== undefined ? options.loop : defaultLoop;
        source.playbackRate.value = options.rate !== undefined ? options.rate : 1;

        const gain = graph.context.createGain();
        let output: AudioNode = source.connect(gain);

        if (options.pan) {
            const panner = graph.context.createStereoPanner();
            panner.pan.value = options.pan;
            output = output.connect(panner);
        }
        output.connect(channel);

        const playback: SoundPlayback = new SoundPlayback(sound, source, gain, options.volume !== undefined ? options.volume : 1, () => this.playbacks.delete(playback));
        this.playbacks.add(playback);
        source.start();

        return playback;
    }

    private startPendingMusic(): void {
        if (this.pendingMusic && this.unlocked) {
            const { soundName, options } = this.pendingMusic;
            this.pendingMusic = undefined;
            this.music = this.start(soundName, this.graph!.music, options, true);
        }
    }

    // Plays a Sound on the sounds channel, or returns undefined if audio is locked or unsupported, or the Sound isn't loaded.
    play(soundName: string, options: PlayOptions = {}): SoundPlayback | undefined {
        if (!this.unlocked) {
            return undefined;
        }

        return this.start(soundName, this.graph!.sounds, options, false);
    }

    // Plays a Sound on the music channel, looping by default, replacing any music playing. If the Sound is already the
    // music, it keeps playing. While audio is locked, the music starts once unlocked, and undefined is returned.
    playMusic(soundName: string, options: PlayOptions = {}): SoundPlayback | undefined {
        if (this.musicName !== soundName) {
            this.stopMusic();
            this.pendingMusic = { soundName: soundName, options: options };
            this.startPendingMusic();
        }

        return this.music;
    }

    // Pauses all audio, e.g. while the game is hidden.
    suspend(): void {
        this.suspended = true;
        if (this.graph) {
            this.graph.context.suspend();
        }
    }

    // Resumes audio paused by suspend.
    resume(): void {
        if (!this.suspended) {
            return;
        }

        this.suspended = false;
        if (this.graph) {
            this.graph.context.resume().then(() => this.startPendingMusic());
        }
    }

    stopAll(): void {
        this.stopMusic();
        Array.from(this.playbacks).forEach(playback => playback.stop());
    }

    stopMusic(): void {
        this.pendingMusic = undefined;

        if (this.music) {
            this.music.stop();
            this.music = undefined;
        }
    }

    // Tries to start audio. Browsers allow this only in response to the player interacting with the page.
    unlock(): Promise<void> {
        const graph = this.getGraph();

        if (!graph || graph.context.state === 'running' || this.suspended) {
            return Promise.resolve();
        }

        // older iOS versions also require a sound to start during the interaction.
        const silence = graph.context.createBufferSource();
        silence.buffer = graph.context.createBuffer(1, 1, graph.context.sampleRate);
        silence.connect(graph.context.destination);
        silence.start();

        return graph.context.resume().then(() => this.startPendingMusic());
    }

    // Unlocks audio the first time the player interacts with the target.
    unlockOnUserGesture(target: EventTarget = document): void {
        const events = ['pointerdown', 'touchend', 'keydown'];
        const onGesture = (): void => {
            this.unlock().then(() => {
                if (this.unlocked) {
                    events.forEach(event => target.removeEventListener(event, onGesture, true));
                }
            });
        };

        events.forEach(event => target.addEventListener(event, onGesture, true));
    }
}
