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

        target.addEventListener('mousemove', (ev: MouseEvent) => {
            [handler._currentX, handler._currentY] = PointerInputHandler.toTargetCoords(target, ev.clientX, ev.clientY);
        });

        target.addEventListener('touchmove', (ev: TouchEvent) => {
            const touch = ev.touches[0];
            if (touch) {
                [handler._currentX, handler._currentY] = PointerInputHandler.toTargetCoords(target, touch.clientX, touch.clientY);
            }
        });

        const onMouseEvent = (ev: MouseEvent): void => {
            const [x, y] = PointerInputHandler.toTargetCoords(target, ev.clientX, ev.clientY);
            raisePointerEvent(new PointerInputEvent(ev.type, x, y));
        };
        target.addEventListener('mousedown', onMouseEvent);
        target.addEventListener('mouseup', onMouseEvent);

        // touches is empty on touchend, so use the touches that changed.
        const onTouchEvent = (ev: TouchEvent): void => {
            const touch = ev.changedTouches[0];
            const [x, y] = touch ? PointerInputHandler.toTargetCoords(target, touch.clientX, touch.clientY) : [0, 0];
            raisePointerEvent(new PointerInputEvent(ev.type, x, y));
        };
        target.addEventListener('touchstart', onTouchEvent);
        target.addEventListener('touchend', onTouchEvent);

        return handler;
    }

    // Converts page client coordinates to the target's coordinates, accounting for a canvas scaled by CSS.
    static toTargetCoords(target: HTMLElement, clientX: number, clientY: number): [number, number] {
        const rect = target.getBoundingClientRect();
        let scaleX = 1;
        let scaleY = 1;

        if (target instanceof HTMLCanvasElement && rect.width > 0 && rect.height > 0) {
            scaleX = target.width / rect.width;
            scaleY = target.height / rect.height;
        }

        return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
    }

    subscribe(callback: (event: PointerInputEvent) => void): InputEventSubscription<PointerInputEvent> {
        const pointerHandler = new InputEventSubscription<PointerInputEvent>(callback);
        this.subscribers.push(pointerHandler);
        return pointerHandler;
    }
}
