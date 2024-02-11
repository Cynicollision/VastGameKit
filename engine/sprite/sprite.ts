export interface SpriteOptions {
    height?: number;
    width?: number;
    frameBorder?: number;
}

export enum SpriteTransformation {
    Opacity = 0,
    Frame = 1,
    TileX = 2,
    TileY = 3,
}

export class Sprite {
    private _name: string;
    get name() { return this._name; }

    private _image: HTMLImageElement;
    get image() { return this._image; }

    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

    private _options: SpriteOptions;
    get options() { return this._options; }

    get height(): number {
        return this._options.height || this._image.height;
    }
    
    get width(): number {
        return this._options.width || this._image.width;
    }

    static fromImage(name: string, source: string, options?: SpriteOptions): Sprite {
        const sprite = new Sprite(name, options);
        sprite._image = new Image();
        sprite.image.src = source;

        return sprite;
    }

    private constructor(name: string, options: SpriteOptions) {
        this._name = name;
        this._options = options || {};
    }

    load(): Promise<void | string> {
        if (this._loaded || !this._image) {
            return Promise.resolve();
        }

        const spriteName = this.name;
        const imageSrc = this._image.src ? this._image.src.substring(0, 100) : undefined;

        return new Promise((resolve, reject) => {
            this._image.onload = function(this: GlobalEventHandlers): void {
                resolve();
            };
            this._image.onerror = function(this: GlobalEventHandlers): void {
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
