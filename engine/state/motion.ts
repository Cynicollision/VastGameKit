import { Geometry } from './../core';

// How an Instance moves each step: by its velocity, in pixels per step, which can also be set as a speed and a direction
// in degrees (see Direction). Instances stay on whole pixels; fractions of a pixel carry over to later steps, so slow
// and uneven speeds move smoothly on average.
export class InstanceMotion {
    private _velocityX = 0;
    private _velocityY = 0;
    // kept separately so it survives the speed being 0.
    private _direction = 0;
    // fractions of a pixel moved but not yet applied.
    private remainderX = 0;
    private remainderY = 0;

    private _blockedX = false;
    // whether a solid Instance stopped the last step's horizontal movement.
    get blockedX() { return this._blockedX; }

    private _blockedY = false;
    // whether a solid Instance stopped the last step's vertical movement, e.g. landing on the ground.
    get blockedY() { return this._blockedY; }

    get velocityX() { return this._velocityX; }
    set velocityX(value: number) {
        this._velocityX = value;
        this.updateDirection();
    }

    get velocityY() { return this._velocityY; }
    set velocityY(value: number) {
        this._velocityY = value;
        this.updateDirection();
    }

    get direction() { return this._direction; }
    set direction(value: number) {
        const speed = this.speed;
        this._direction = value;
        this.setVelocity(speed, value);
    }

    get speed() { return Math.sqrt(this._velocityX * this._velocityX + this._velocityY * this._velocityY); }
    set speed(value: number) {
        this.setVelocity(value, this._direction);
    }

    private setVelocity(speed: number, direction: number): void {
        this._velocityX = Geometry.getLengthDirectionX(speed, direction);
        this._velocityY = Geometry.getLengthDirectionY(speed, direction);
    }

    private updateDirection(): void {
        if (this._velocityX !== 0 || this._velocityY !== 0) {
            this._direction = (Math.atan2(this._velocityY, this._velocityX) * 180 / Math.PI + 360) % 360;
        }
    }

    stop(): void {
        this._velocityX = 0;
        this._velocityY = 0;
        this.remainderX = 0;
        this.remainderY = 0;
    }

    // Moves by the velocity, one axis at a time, as far as isFree allows (see ActorInstance.step).
    move(position: { x: number; y: number }, isFree: (x: number, y: number) => boolean): void {
        this.remainderX += this._velocityX;
        this.remainderY += this._velocityY;

        const moveX = Math.round(this.remainderX);
        const moveY = Math.round(this.remainderY);
        this.remainderX -= moveX;
        this.remainderY -= moveY;

        position.x += InstanceMotion.getAllowedDistance(moveX, distance => isFree(position.x + distance, position.y));
        // blocked means a solid is right against it in the direction it's moving, even while moving less than a pixel.
        const signX = Math.sign(this._velocityX);
        this._blockedX = signX !== 0 && !isFree(position.x + signX, position.y);
        if (this._blockedX) {
            this.remainderX = 0;
        }

        position.y += InstanceMotion.getAllowedDistance(moveY, distance => isFree(position.x, position.y + distance));
        const signY = Math.sign(this._velocityY);
        this._blockedY = signY !== 0 && !isFree(position.x, position.y + signY);
        if (this._blockedY) {
            this.remainderY = 0;
        }
    }

    // The furthest whole distance, up to the given distance, that can be moved along one axis.
    private static getAllowedDistance(distance: number, isFree: (distance: number) => boolean): number {
        if (distance === 0 || isFree(distance)) {
            return distance;
        }

        const sign = Math.sign(distance);
        let allowed = 0;

        for (let tryDistance = sign; Math.abs(tryDistance) < Math.abs(distance); tryDistance += sign) {
            if (!isFree(tryDistance)) {
                break;
            }
            allowed = tryDistance;
        }

        return allowed;
    }
}
