import { Direction } from './enum';

export class GameEvent {
    protected innerEvent?: GameEvent;

    private _name: string;
    get name(): string { return this._name; }

    private _isCancelled: boolean = false;
    get isCancelled() { return this._isCancelled; }

    private _data: any;
    get data() { return this._data; }

    static new(eventName: string, data?: any): GameEvent {
        return new GameEvent(eventName, data);
    }

    constructor(name: string, data?: any) {
        this._name = name;
        this._data = data;
        this._isCancelled = false;
    }

    cancel(): void {
        this._isCancelled = true;
        if (this.innerEvent) {
            this.innerEvent.cancel();
        }
    }
}

export class KeyboardInputEvent extends GameEvent {
    // the key's value, lowercase for single characters, e.g. 'w', 'ArrowLeft', or ' '.
    key: string;
    // the physical key, regardless of keyboard layout or modifiers, e.g. 'KeyW', 'ArrowLeft', or 'Space'.
    code: string;
    type: string;
    // whether this is a keydown repeated by holding the key.
    repeat: boolean;

    // Single character keys are compared case-insensitively, so Shift or Caps Lock doesn't change them.
    static normalizeKey(key: string): string {
        return key.length === 1 ? key.toLowerCase() : key;
    }

    constructor(key: string, type: string, code: string = key, repeat: boolean = false) {
        super(key);
        this.key = KeyboardInputEvent.normalizeKey(key);
        this.code = code;
        this.type = type;
        this.repeat = repeat;
    }
}

export type PointerInputDetails = {
    // identifies each pointer, e.g. each finger, while it's down.
    pointerId?: number;
    // 'mouse', 'touch', or 'pen'.
    pointerType?: string;
    // on 'pointerup', the direction of a swipe (see PointerInputHandler.SwipeDistance).
    swipe?: Direction;
};

export class PointerInputEvent extends GameEvent {
    // 'pointerdown', 'pointermove', or 'pointerup'.
    type: string;
    x: number;
    y: number;
    readonly pointerId: number;
    readonly pointerType: string;
    readonly swipe?: Direction;

    constructor(type: string, x: number, y: number, innerEvent?: PointerInputEvent, details: PointerInputDetails = {}) {
        super(type);
        this.innerEvent = innerEvent;
        this.type = type;
        this.x = x;
        this.y = y;
        this.pointerId = details.pointerId !== undefined ? details.pointerId : 1;
        this.pointerType = details.pointerType || 'mouse';
        this.swipe = details.swipe;
    }

    translate(diffX: number, diffY: number): PointerInputEvent {
        return new PointerInputEvent(this.type, this.x + diffX, this.y + diffY, this, this);
    }
}

