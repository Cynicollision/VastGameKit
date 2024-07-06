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

    private _height: number = 0;
    get height(): number {
        return this._height || this.image.height;
    }
    
    private _width: number = 0;
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
        let frameRow = 0;

        if (this.image.width) {
            const framesPerRow = Math.floor(this.image.width / this.width);
            while (this.width * frame >= framesPerRow * this.width) {
                frame -= framesPerRow;
                frameRow++;
            }
        }

        const frameXOffset = frame * this.frameBorder;
        const frameYOffset = frameRow * this.frameBorder;
        const srcX = frame * this.width + frameXOffset;
        const srcY = frameRow * this.height + frameYOffset;

        return [srcX, srcY];
    }

    loadImage(): Promise<void | string> {
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

    newAnimation(): SpriteAnimation {
        return new SpriteAnimation(this);
    }
}
