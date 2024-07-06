import { AudioOptions } from './../device/audio';

export type SoundOptions = {
    // TODO include "common" effects at top level, allow custom nodes to be used as well.
    source: string;
    audioOptions?: AudioOptions,
};

export class Sound { 
    readonly name: string;
    readonly source: string;

    static new(name: string, options: SoundOptions): Sound {
        return new Sound(name, options);
    }

    private constructor(name: string, options: SoundOptions) {
        this.name = name;
        this.source = options.source;

        // TODO process rest of options
    }

    loadAudio(): Promise<void | string> {
        const audio = new Audio(this.source);
        const soundName = this.name;
        const soundSource = this.source;

        return new Promise((resolve, reject) => {
            audio.oncanplaythrough = function(this: GlobalEventHandlers): void {
                resolve();
            };
            audio.onerror = function(this: GlobalEventHandlers): void {
                reject(`Failed to load Sound "${soundName}" from source: ${soundSource}.`);
            };
        });
    }
    
}