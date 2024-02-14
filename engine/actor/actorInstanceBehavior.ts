import { GameState } from './../game';
import { ActorLifecycleCallback } from './actor';
import { ActorInstance } from './actorInstance';

export enum ActorInstanceBehaviorName {
    BasicMotion = 'BasicMotion',
}

export enum Direction {
    Right = 0,
    Down = 90,
    Left = 180,
    Up = 270,
}

export type ActorInstanceBehavior = {
    beforeStep?: ActorLifecycleCallback;
    afterStep?: ActorLifecycleCallback;
};

export class ActorInstanceMotionBehavior implements ActorInstanceBehavior {
    direction: number = 0;
    speed: number = 0;
    previousX: number = 0;
    previousY: number = 0;

    beforeStep(self: ActorInstance, state: GameState): void {
        this.previousX = self.x;
        this.previousY = self.y;

        if (this.speed !== 0) {
            // TODO get new position, see if free from solid actorInstances
            //  how to get position "to" that instance, if one is detected?
            // also move to new method: applyMotion(speed, direction, relative);
            self.x += this.getLengthDirectionX(this.speed, this.direction);
            self.y += this.getLengthDirectionY(this.speed, this.direction);
        }
    }

    afterStep(self: ActorInstance, state: GameState): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            for (const actorName of self.actor.getCollisionActorNames()) {
                const otherInstances = self.layer.getActorInstances(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        self.actor.callCollision(self, other, state);
                    }
                }
            }
        }
    }

    private getLengthDirectionX(length: number, direction: number): number {
        return length * Math.cos(direction * (Math.PI / 180));
    }

    private getLengthDirectionY(length: number, direction: number) {
        return length * Math.sin(direction * (Math.PI / 180));
    }
}
