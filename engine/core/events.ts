export class GameEvent {
    private _name: string;
    get name(): string { return this._name; }

    private _isCancelled: boolean = false;
    get isCancelled() { return this._isCancelled; }

    private _data: any;
    get data() { return this._data; }

    static init(eventName: string, data?: any): GameEvent {
        return new GameEvent(eventName, data);
    }

    constructor(name: string, data?: any) {
        this._name = name;
        this._data = data;
        this._isCancelled = false;
    }

    cancel(): void {
        this._isCancelled = true;
    }
}

export class KeyboardInputEvent extends GameEvent {
    key: string;
    type: string;

    static fromKeyboardEvent(ev: KeyboardEvent): KeyboardInputEvent {
        return new KeyboardInputEvent(ev.key, ev.type);
    }

    constructor(key: string, type: string) {
        super(key);
        this.key = key;
        this.type = type;
    }
}

export class PointerInputEvent extends GameEvent {
    type: string;
    x: number;
    y: number;

    static fromMouseEvent(ev: MouseEvent): PointerInputEvent {
        return new PointerInputEvent(ev.type, ev.offsetX, ev.offsetY);
    }

    static fromTouchEvent(ev: TouchEvent): PointerInputEvent {
        const touch = ev.touches[0];
        const touchX = touch ? touch.clientX : 0;
        const touchY = touch ? touch.clientY : 0;
        return new PointerInputEvent(ev.type, touchX, touchY);
    }

    constructor(type: string, x: number, y: number) {
        super(type);
        this.type = type;
        this.x = x;
        this.y = y;
    }

    translate(diffX: number, diffY: number): PointerInputEvent {
        return new PointerInputEvent(this.type, this.x + diffX, this.y + diffY);
    }
}

