import { GameConstruction } from './../structure/construction';

export type AudioOptions = {
    chain?: AudioNode[];
    pan?: number;
    volume?: number;
};

export class GameAudio {
    private readonly construction: GameConstruction;
    private audioContext: AudioContext;

    constructor(construction: GameConstruction) {
        this.construction = construction;
    }

    play(soundName: string, options: AudioOptions = {}): void {
        const sound = this.construction.sounds.get(soundName);
        const audio = new Audio(sound.source);

        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        const source = this.audioContext.createMediaElementSource(audio);

        // TODO: override "base" sound.options with those passed in.
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = options.pan !== undefined ? options.pan : 0;
        const gain = this.audioContext.createGain();
        gain.gain.value = options.volume !== undefined ? options.volume : 1;
        source.connect(gain).connect(panner).connect(this.audioContext.destination);

        // TODO return audio or "playback wrapper" for it
        audio.play();

    }
}
