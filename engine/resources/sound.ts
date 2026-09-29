import { GameError } from './../core';

export type SoundOptions = {
    source: string;
    // the volume the Sound plays at, from 0 to 1. Default 1.
    volume?: number;
};

export class Sound {
    readonly name: string;
    readonly source: string;
    readonly volume: number;

    private _buffer?: AudioBuffer;
    // the decoded audio, once loaded.
    get buffer() { return this._buffer; }

    get loaded() { return this._buffer !== undefined; }

    static new(name: string, options: SoundOptions): Sound {
        return new Sound(name, options);
    }

    private constructor(name: string, options: SoundOptions) {
        this.name = name;
        this.source = options.source;
        this.volume = options.volume !== undefined ? options.volume : 1;
    }

    // Fetches and decodes the Sound. Without an audio context (audio is unsupported), the Sound stays unloaded and
    // plays nothing.
    load(context?: BaseAudioContext): Promise<void> {
        if (this._buffer || !context) {
            return Promise.resolve();
        }

        return fetch(this.source)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(data => context.decodeAudioData(data))
            .then(buffer => {
                this._buffer = buffer;
            })
            .catch(error => {
                throw new GameError(`Failed to load Sound "${this.name}" from source: ${this.source}. ${error instanceof Error ? error.message : error}`);
            });
    }
}
