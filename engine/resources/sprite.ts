import { SpriteAnimation } from './spriteAnimation';

export type SpriteOptions = {
    source: string;
    height?: number;
    width?: number;
    frameBorder?: number;
};

export class Sprite {
    readonly name: string;
    readonly image: HTMLImageElement;
    readonly frameBorder: number;

    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

    private _height?: number;
    get height(): number {
        return this._height || this.image.height;
    }
    
    private _width?: number;
    get width(): number {
        return this._width || this.image.width;
    }

    static new(name: string, options: SpriteOptions): Sprite {
        return new Sprite(name, options);
    }

    private constructor(name: string, options: SpriteOptions) {
        this.name = name;
        this.image = new Image();
        this.image.src = options.source;

        this.frameBorder = options.frameBorder || 0;
        this._height = options.height;
        this._width = options.width;
    }

    getFrameImageSourceCoords(frame: number): [number, number] {
        const framesPerRow = this.image.width
            ? Math.max(1, Math.floor((this.image.width + this.frameBorder) / (this.width + this.frameBorder)))
            : Number.MAX_SAFE_INTEGER;
        const frameColumn = frame % framesPerRow;
        const frameRow = Math.floor(frame / framesPerRow);

        const srcX = frameColumn * (this.width + this.frameBorder);
        const srcY = frameRow * (this.height + this.frameBorder);

        return [srcX, srcY];
    }

    loadImage(): Promise<void | string> {
        if (this._loaded || !this.image) {
            return Promise.resolve();
        }

        const spriteName = this.name;
        const imageSrc = this.image.src ? this.image.src.substring(0, 100) : undefined;

        // the image may have finished loading (or failed) before this was called.
        if (this.image.complete) {
            if (this.image.naturalWidth > 0) {
                this._loaded = true;
                return Promise.resolve();
            }
            return Promise.reject(`Failed to load Sprite "${spriteName}" from source: ${imageSrc}.`);
        }

        return new Promise((resolve, reject) => {
            this.image.onload = (): void => {
                this._loaded = true;
                resolve();
            };
            this.image.onerror = function(this: GlobalEventHandlers): void {
                reject(`Failed to load Sprite "${spriteName}" from source: ${imageSrc}.`);
            };
        });
    }

    newAnimation(): SpriteAnimation {
        return new SpriteAnimation(this);
    }
}
