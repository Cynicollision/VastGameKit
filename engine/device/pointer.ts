import { Direction, PointerInputEvent } from './../core';
import { InputEventSubscription, InputHandler } from './input';

// Mouse, touch, and pen input on a canvas, raised as 'pointerdown', 'pointermove', and 'pointerup' events in canvas
// coordinates.
export class PointerInputHandler implements InputHandler<PointerInputEvent> {
    // how far, in CSS pixels, a press must move before its release counts as a swipe.
    static readonly SwipeDistance = 30;

    // where each pointer that's down was pressed, in client coordinates.
    private readonly pressedAt = new Map<number, { clientX: number; clientY: number }>();
    private subscribers: InputEventSubscription<PointerInputEvent>[] = [];

    static initForElement(target: HTMLElement): PointerInputHandler {
        const handler = new PointerInputHandler();

        // touching the target plays the game instead of scrolling or zooming the page.
        target.style.touchAction = 'none';

        target.addEventListener('pointerdown', ev => {
            handler.pressedAt.set(ev.pointerId, { clientX: ev.clientX, clientY: ev.clientY });
            try {
                // keeps reporting a drag that leaves the target.
                target.setPointerCapture(ev.pointerId);
            }
            catch {
                // the pointer is no longer active.
            }
            handler.raise(target, ev, 'pointerdown');
        });

        target.addEventListener('pointermove', ev => handler.raise(target, ev, 'pointermove'));

        const onRelease = (ev: PointerEvent): void => {
            const pressedAt = handler.pressedAt.get(ev.pointerId);
            handler.pressedAt.delete(ev.pointerId);
            const swipe = pressedAt && ev.type === 'pointerup' ? PointerInputHandler.getSwipe(ev.clientX - pressedAt.clientX, ev.clientY - pressedAt.clientY) : undefined;
            handler.raise(target, ev, 'pointerup', swipe);
        };
        target.addEventListener('pointerup', onRelease);
        target.addEventListener('pointercancel', onRelease);

        return handler;
    }

    // The direction of a movement long enough to be a swipe.
    static getSwipe(deltaX: number, deltaY: number): Direction | undefined {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < PointerInputHandler.SwipeDistance) {
            return undefined;
        }

        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            return deltaX > 0 ? Direction.Right : Direction.Left;
        }

        return deltaY > 0 ? Direction.Down : Direction.Up;
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

    private raise(target: HTMLElement, ev: PointerEvent, type: string, swipe?: Direction): void {
        const [x, y] = PointerInputHandler.toTargetCoords(target, ev.clientX, ev.clientY);
        const event = new PointerInputEvent(type, x, y, undefined, { pointerId: ev.pointerId, pointerType: ev.pointerType, swipe: swipe });

        for (const subscriber of this.subscribers) {
            if (subscriber.isActive) {
                subscriber.callback(event);
            }
        }
    }

    subscribe(callback: (event: PointerInputEvent) => void): InputEventSubscription<PointerInputEvent> {
        const pointerHandler = new InputEventSubscription<PointerInputEvent>(callback);
        this.subscribers.push(pointerHandler);
        return pointerHandler;
    }
}

export type PointerPosition = {
    readonly x: number;
    readonly y: number;
};

// The pointer's position and presses, in canvas coordinates (see SceneState.toScenePosition). With several touches,
// this follows the first; the rest are in pointers.
export interface PointerState {
    readonly x: number;
    readonly y: number;
    readonly isDown: boolean;
    // whether a press started or ended since the previous step.
    readonly wasPressed: boolean;
    readonly wasReleased: boolean;
    // where the current, or last, press started.
    readonly pressX: number;
    readonly pressY: number;
    // the direction of a swipe released since the previous step.
    readonly swipe: Direction | undefined;
    // 'mouse', 'touch', or 'pen'.
    readonly type: string;
    // every pointer that's down, by pointer id.
    readonly pointers: ReadonlyMap<number, PointerPosition>;
}

export class GamePointerState implements PointerState {
    private readonly _pointers = new Map<number, PointerPosition>();
    get pointers(): ReadonlyMap<number, PointerPosition> { return this._pointers; }

    // the pointer this state follows while it's down.
    private primaryId?: number;
    private nextPressed = false;
    private nextReleased = false;
    private nextSwipe?: Direction;

    private _x = 0;
    get x() { return this._x; }

    private _y = 0;
    get y() { return this._y; }

    get isDown() { return this.primaryId !== undefined; }

    private _wasPressed = false;
    get wasPressed() { return this._wasPressed; }

    private _wasReleased = false;
    get wasReleased() { return this._wasReleased; }

    private _pressX = 0;
    get pressX() { return this._pressX; }

    private _pressY = 0;
    get pressY() { return this._pressY; }

    private _swipe?: Direction;
    get swipe() { return this._swipe; }

    private _type = 'mouse';
    get type() { return this._type; }

    private moveTo(ev: PointerInputEvent): void {
        this._x = ev.x;
        this._y = ev.y;
        this._type = ev.pointerType;
    }

    onEvent(ev: PointerInputEvent): void {
        const id = ev.pointerId;

        if (ev.type === 'pointerdown') {
            this._pointers.set(id, { x: ev.x, y: ev.y });

            if (this.primaryId === undefined) {
                this.primaryId = id;
                this.moveTo(ev);
                this._pressX = ev.x;
                this._pressY = ev.y;
                this.nextPressed = true;
            }
        }
        else if (ev.type === 'pointermove') {
            if (this._pointers.has(id)) {
                this._pointers.set(id, { x: ev.x, y: ev.y });
            }

            // a mouse is followed even while no button is down, e.g. for aiming or hovering.
            if (id === this.primaryId || (this.primaryId === undefined && ev.pointerType === 'mouse')) {
                this.moveTo(ev);
            }
        }
        else if (ev.type === 'pointerup') {
            this._pointers.delete(id);

            if (id === this.primaryId) {
                this.primaryId = undefined;
                this.moveTo(ev);
                this.nextReleased = true;
                this.nextSwipe = ev.swipe;
            }
        }
    }

    // Starts a new step: presses, releases, and swipes since the previous step become this step's.
    step(): void {
        this._wasPressed = this.nextPressed;
        this._wasReleased = this.nextReleased;
        this._swipe = this.nextSwipe;
        this.nextPressed = false;
        this.nextReleased = false;
        this.nextSwipe = undefined;
    }
}
