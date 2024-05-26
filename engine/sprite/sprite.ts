export type SpriteOptions = {
    height?: number;
    width?: number;
    frameBorder?: number;
};

export class Sprite {
    readonly name: string;
    readonly image: HTMLImageElement;
    readonly options: SpriteOptions;

    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

    get height(): number {
        return this.options.height || this.image.height;
    }
    
    get width(): number {
        return this.options.width || this.image.width;
    }

    static fromSource(name: string, source: string, options: SpriteOptions = {}): Sprite {
        return new Sprite(name, source, options);
    }

    private constructor(name: string, source: string, options: SpriteOptions) {
        this.name = name;
        this.options = options || {};
        this.image = new Image();
        this.image.src = source;
    }

    load(): Promise<void | string> {
        if (this._loaded || !this.image) {
            return Promise.resolve();
        }

        const spriteName = this.name;
        const imageSrc = this.image.src ? this.image.src.substring(0, 100) : undefined;

        return new Promise((resolve, reject) => {
            this.image.onload = function(this: GlobalEventHandlers): void {
                resolve();
            };
            this.image.onerror = function(this: GlobalEventHandlers): void {
                reject(`Failed to load Sprite "${spriteName}" from source: ${imageSrc}.`);
            };
        });
    }
    
    getFrameImageSourceCoords(frame: number): [number, number] {
        const frameBorder = this.options.frameBorder || 0;
        let frameRow = 0;

        if (this.image.width) {
            const framesPerRow = Math.floor(this.image.width / this.width);
            while (this.width * frame >= framesPerRow * this.width) {
                frame -= framesPerRow;
                frameRow++;
            }
        }

        const frameXOffset = frame * frameBorder;
        const frameYOffset = frameRow * frameBorder;
        const srcX = frame * this.width + frameXOffset;
        const srcY = frameRow * this.height + frameYOffset;

        return [srcX, srcY];
    }
}
