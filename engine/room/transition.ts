import { GameCanvas } from './../device';
import { Room } from './room';
import { MathUtil } from './../util';

export enum RoomTransitionType {
    Fade = 'Fade',
}

export type RoomTransitionOptions = {
    color?: string;
    durationMs?: number;
}

export interface RoomTransition {
    start(onTransitionallback: () => void, onEndCallback: () => void): void;
    draw(room: Room, canvas: GameCanvas): void
}

export class RoomTransitionFactory {
    static new(type: RoomTransitionType, options: RoomTransitionOptions = {}): RoomTransition {
        switch (type) {
            case RoomTransitionType.Fade:
                return new RoomFadeTransition(options);  
        }
    }
}

export class RoomFadeTransition implements RoomTransition {
    private static readonly DefaultColor = '#000';
    private static readonly DefaultDurationMs = 1000;

    private color: string;
    private currentValue = 0;
    private durationMs: number;
    private transitionIn = true;

    constructor(options: RoomTransitionOptions = {}) {
        this.color = options.color || '#000';
        this.durationMs = options.durationMs || 1000;
    }

    start(onTransitionallback: () => void, onEndCallback: () => void): void {
        setTimeout(() => {
            onTransitionallback();
            this.transitionIn = false;
            setTimeout(() => {
                onEndCallback();
            }, this.durationMs);
        }, this.durationMs);
    }

    draw(room: Room, canvas: GameCanvas): void {
        const increment = (this.durationMs / 1000) / (room.game.options.targetFPS / 4);
        this.currentValue += this.transitionIn ? increment : -increment;
        this.currentValue = MathUtil.clamp(Math.round(this.currentValue * 100) / 100, 0, 1);
        canvas.fillArea(this.color, room.camera.x, room.camera.y, room.game.canvas.width, room.game.canvas.height, { opacity: this.currentValue });
    }
}