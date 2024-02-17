import { ActorInstance } from './../actor';
import { MathUtil } from './../util/math';
import { Room } from './../room';

export type RoomCameraOptions = {
    centerOnInstanceBoundary?: boolean;
    offsetX?: number;
    offsetY?: number;
    stayWithinRoom?: boolean;
};

export class RoomCamera {
    private readonly room: Room;
    private followingInstance: ActorInstance;
    private options: RoomCameraOptions = {};

    private _x: number = 0;
    get x() { return this._x; }
    
    private _y: number = 0;
    get y() { return this._y; }

    constructor(room: Room) {
        this.room = room;
    }

    follow(instance: ActorInstance, options: RoomCameraOptions = {}): void {
        this.followingInstance = instance;
        this.options = options;
        this.options.centerOnInstanceBoundary = this.options.centerOnInstanceBoundary !== undefined ? this.options.centerOnInstanceBoundary : false;
        this.options.offsetX = this.options.offsetX || 0;
        this.options.offsetY = this.options.offsetY || 0;
        this.options.stayWithinRoom = this.options.stayWithinRoom !== undefined ? this.options.stayWithinRoom : true;
    }

    updatePosition(): void {
        if (!this.followingInstance) {
            return;
        }

        const minXY = this.options.stayWithinRoom ? 0 : -Infinity;
        const maxX = this.options.stayWithinRoom ? this.room.width - this.room.game.canvas.width : Infinity;
        const maxY = this.options.stayWithinRoom ? this.room.height - this.room.game.canvas.height : Infinity;

        const center = this.options.centerOnInstanceBoundary && this.followingInstance.actor.boundary;

        const newX = center ? (this.followingInstance.x - this.room.game.canvas.width / 2 + this.followingInstance.actor.boundary.width / 2) : this.followingInstance.x;
        this._x = MathUtil.clamp(newX - this.options.offsetX, minXY, maxX);

        const newY = center ? (this.followingInstance.y - this.room.game.canvas.height / 2 + this.followingInstance.actor.boundary.height / 2) : this.followingInstance.y;
        this._y = MathUtil.clamp(newY - this.options.offsetY, minXY, maxY);
    }
}