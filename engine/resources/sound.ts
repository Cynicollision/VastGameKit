export type SoundOptions = {
    // TODO include "common" effects at top level, allow custom nodes to be used as well.
    chain?: AudioNode[],
    pan?: number;
    volume?: number;
};

export class Sound { 
    readonly name: string;
    readonly source: string;

    static fromSource(name: string, source: string, options: SoundOptions = {}): Sound {
        return new Sound(name, source, options);
    }

    constructor(name: string, source: string, options: SoundOptions = {}) {
        this.name = name;
        this.source = source;

        // TODO process options
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