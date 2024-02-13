import { GameEvent } from "./../game";

export class InputEventHandler<T> {
    callback: (event: T) => void;
    isAlive: boolean = true;

    constructor(callback: (event: T) => void) {
        this.callback = callback;
    }

    get isActive(): boolean {
        return this.isAlive;
    }

    dispose(): void {
        this.isAlive = false;
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
        return new PointerInputEvent(ev.type, getTouchEventX(ev), getTouchEventY(ev));
    }

    constructor(type: string, x: number, y: number) {
        super(type);
        this.type = type;
        this.x = x;
        this.y = y;
    }
}

export interface GameInputHandler {
    currentX: number;
    currentY: number;
    registerPointerInputHandler(callback: (event: PointerInputEvent) => void): InputEventHandler<PointerInputEvent>;
    registerKeyboardInputHandler(callback: (event: KeyboardEvent) => void): InputEventHandler<KeyboardEvent>;
}

export class BrowserDocumentInputHandler implements GameInputHandler {
    private keyboardEventHandlers: InputEventHandler<KeyboardEvent>[] = [];
    private pointerEventHandlers: InputEventHandler<PointerInputEvent>[] = [];

    private _currentX: number;
    private _currentY: number;

    get currentX(): number {
        return this._currentX;
    }

    get currentY(): number {
        return this._currentY;
    }
    
    static initForElement(body: HTMLElement): BrowserDocumentInputHandler {
        const inputHandler = new BrowserDocumentInputHandler();

        function raiseKeyboardEvent(ev: KeyboardEvent): void {
            inputHandler.keyboardEventHandlers.forEach((handler: InputEventHandler<KeyboardEvent>) => {
                if (handler.isActive) {
                    handler.callback(ev);
                }
            });
        }

        function raisePointerEvent(ev: PointerInputEvent): void {
            inputHandler.pointerEventHandlers.forEach((handler: InputEventHandler<PointerInputEvent>) => {
                if (handler.isActive) {
                    handler.callback(ev);
                }
            });
        }

        body.onkeydown = body.onkeyup = function(this: GlobalEventHandlers, ev: KeyboardEvent): void {
            raiseKeyboardEvent(ev);
        };

        body.onmousemove = function trackActiveMousePosition(this: GlobalEventHandlers, ev: MouseEvent): void {
            inputHandler._currentX = ev.offsetX;
            inputHandler._currentY = ev.offsetY;
        };

        body.ontouchmove = function trackActiveTouchPosition(ev: TouchEvent): void {
            inputHandler._currentX = getTouchEventX(ev);
            inputHandler._currentY = getTouchEventY(ev);
        };

        body.onmousedown = body.onmouseup = function(this: GlobalEventHandlers, ev: MouseEvent): void {
            raisePointerEvent(PointerInputEvent.fromMouseEvent(ev));
        };

        body.ontouchstart = body.ontouchend = function (ev: TouchEvent) {
            raisePointerEvent(PointerInputEvent.fromTouchEvent(ev));
        };

        return inputHandler;
    }

    registerPointerInputHandler(callback: (event: PointerInputEvent) => void): InputEventHandler<PointerInputEvent> {
        const clickHandler = new InputEventHandler<PointerInputEvent>(callback);
        this.pointerEventHandlers.push(clickHandler);

        return clickHandler;
    }

    registerKeyboardInputHandler(callback: (event: KeyboardEvent) => void): InputEventHandler<KeyboardEvent> {
        const clickHandler = new InputEventHandler<KeyboardEvent>(callback);
        this.keyboardEventHandlers.push(clickHandler);

        return clickHandler;
    }
}

function getTouchEventX(ev: TouchEvent): number {
    const touch = ev.touches[0];
    return touch ? touch.clientX : 0
}

function getTouchEventY(ev: TouchEvent): number {
    const touch = ev.touches[0];
    return touch ? touch.clientY : 0
}
