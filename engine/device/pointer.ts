import { PointerInputEvent } from './../core';
import { InputEventSubscription, InputHandler } from './input';

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
            handler._currentX = ev.touches[0] ? ev.touches[0].clientX : 0;
            handler._currentY = ev.touches[0] ? ev.touches[0].clientY : 0;
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
