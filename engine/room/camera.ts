import { ActorInstance } from './../actor';

export class RoomCamera {
    offsetX: number = 0;
    offsetY: number = 0;
    x: number = 0;
    y: number = 0;

    private followingInstance: ActorInstance;

    follow(instance: ActorInstance, offsetX = 0, offsetY = 0): void {
        this.followingInstance = instance;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    updatePosition(): void {
        if (this.followingInstance) {
            this.x = this.followingInstance.x - this.offsetX;
            this.y = this.followingInstance.y - this.offsetY;
        }
    }
}