import { CanvasDrawImageOptions, CanvasFillOptions, GameCanvas, GameCanvasHtml2D, GameCanvasOptions } from './../device/canvas';
import { Sprite } from './sprite';
import { TileMap } from './tilemap';

export type BackgroundOptions = {
    color: string,
    height: number;
    width: number;
    x?: number;
    y?: number;
};

export type BackgroundDrawOptions = CanvasDrawImageOptions | CanvasFillOptions;

export class Background {
    private static readonly DefaultColor = '#CCC';

    private readonly height: number = 0;
    private readonly width: number = 0;
    private readonly x: number = 0;
    private readonly y: number = 0;

    private readonly backgroundCanvas: GameCanvas;

    private constructor(options: BackgroundOptions) {
        this.height = options.height;
        this.width = options.width;
        this.x = options.x || 0;
        this.y = options.y || 0;

        const canvasOptions: GameCanvasOptions = {
            backgroundColor: options.color,
            height: this.height,
            width: this.width
        };

        this.backgroundCanvas = GameCanvasHtml2D.initNewCanvas(canvasOptions);
    }

    static createDefaultBackground(width: number, height: number): Background {
        return new Background({ color: Background.DefaultColor, width: width, height: height });
    }

    setFromColor(color: string, drawOptions: CanvasFillOptions = {}): void {
        this.backgroundCanvas.fillArea(color, this.x, this.y, this.width, this.height, drawOptions);
    }

    setFromSprite(sprite: Sprite, drawOptions: CanvasDrawImageOptions = {}): void {
        this.backgroundCanvas.drawSprite(sprite, this.x, this.y, {
            ...drawOptions,
            repeatX: drawOptions.repeatX !== undefined ? drawOptions.repeatX : true,
            repeatY: drawOptions.repeatY !== undefined ? drawOptions.repeatY : true,
            repeatHeight: drawOptions.repeatHeight || this.height,
            repeatWidth: drawOptions.repeatWidth || this.width,
        });
    }

    // Draws a TileMap's visible tile layers, or the named layers in the given order, onto the Background.
    setFromTileMap(map: TileMap, layerNames?: string[]): void {
        const layers = layerNames ? layerNames.map(name => map.getLayer(name)) : map.layers.filter(layer => layer.visible);

        for (const layer of layers) {
            for (let row = 0; row < layer.height; row++) {
                for (let column = 0; column < layer.width; column++) {
                    const tile = map.getTile(layer.tiles[row * layer.width + column]);
                    if (!tile) {
                        continue;
                    }

                    // tiles taller than the map's tiles extend upward, as in Tiled.
                    const x = this.x + layer.offsetX + column * map.tileWidth;
                    const y = this.y + layer.offsetY + (row + 1) * map.tileHeight - tile.height;
                    this.backgroundCanvas.drawImage(tile.image, tile.sx, tile.sy, tile.width, tile.height, x, y, tile.width, tile.height, { opacity: layer.opacity });
                }
            }
        }
    }

    // Draws the part of the Background within the given view, or all of it.
    draw(canvas: GameCanvas, view?: { x: number, y: number, width: number, height: number }): void {
        let left = this.x;
        let top = this.y;
        let right = this.x + this.width;
        let bottom = this.y + this.height;

        if (view) {
            left = Math.max(left, Math.floor(view.x));
            top = Math.max(top, Math.floor(view.y));
            right = Math.min(right, Math.ceil(view.x + view.width));
            bottom = Math.min(bottom, Math.ceil(view.y + view.height));
        }

        if (right > left && bottom > top) {
            canvas.drawCanvas(this.backgroundCanvas, left - this.x, top - this.y, right - left, bottom - top, left, top, right - left, bottom - top);
        }
    }
}