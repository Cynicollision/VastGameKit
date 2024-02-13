export type GameAudioOptions = {
    // TODO
};

export class GameAudio {
    readonly audio: HTMLAudioElement;
    readonly name: string;
    readonly options: GameAudioOptions;

    static fromSource(name: string, source: string, options: GameAudioOptions = {}): GameAudio {
        return new GameAudio(name, source, options);
    }

    constructor(name: string, source: string, options: GameAudioOptions = {}) {
        this.name = name;
        this.options = options;
        this.audio = new Audio(source);
    }
}
