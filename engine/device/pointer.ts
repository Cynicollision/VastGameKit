import { GameEvent } from './../core/event';
import { InputEventSubscription, InputHandler } from './input';

function getTouchEventX(ev: TouchEvent): number {
    const touch = ev.touches[0];
    return touch ? touch.clientX : 0
}

function getTouchEventY(ev: TouchEvent): number {
    const touch = ev.touches[0];
    return touch ? touch.clientY : 0
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

    translate(diffX: number, diffY: number): PointerInputEvent {
        return new PointerInputEvent(this.type, this.x + diffX, this.y + diffY);
    }
}

export class PointerInputHandler implements InputHandler<PointerInputEvent> {
    private subscribers: InputEventSubscription<PointerInputEvent>[] = [];

    private _currentX: number = 0;
    get currentX(): number { return this._currentX; }

    private _currentY: number = 0;
    get currentY(): number { return this._currentY; }
    
    static initForElement(target: HTMLElement): PointerInputHandler {
        const handler = new PointerInputHandler();

        function raisePointerEvent(ev: PointerInputEvent): void {
            handler.subscribers.forEach((handler: InputEventSubscription<PointerInputEvent>) => {
                if (handler.isActive) {
                    handler.callback(ev);
                }
            });
        }

        target.onmousemove = function trackActiveMousePosition(this: GlobalEventHandlers, ev: MouseEvent): void {
            handler._currentX = ev.offsetX;
            handler._currentY = ev.offsetY;
        };

        target.ontouchmove = function trackActiveTouchPosition(ev: TouchEvent): void {
            handler._currentX = getTouchEventX(ev);
            handler._currentY = getTouchEventY(ev);
        };

        target.onmousedown = target.onmouseup = function(this: GlobalEventHandlers, ev: MouseEvent): void {
            raisePointerEvent(PointerInputEvent.fromMouseEvent(ev));
        };

        target.ontouchstart = target.ontouchend = function (ev: TouchEvent) {
            raisePointerEvent(PointerInputEvent.fromTouchEvent(ev));
        };

        return handler;
    }

    subscribe(callback: (event: PointerInputEvent) => void): InputEventSubscription<PointerInputEvent> {
        const pointerHandler = new InputEventSubscription<PointerInputEvent>(callback);
        this.subscribers.push(pointerHandler);
        return pointerHandler;
    }
}
