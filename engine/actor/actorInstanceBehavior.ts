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

    beforeStep(self: ActorInstance, state: GameState): void {
        if (this.speed !== 0) {
            // TODO get new position, see if free from solid actorInstances
            //  how to get position "to" that instance, if one is detected?
            // also move to new method: applyMotion(speed, direction, relative);
            self.x += this.getLengthDirectionX(this.speed, this.direction);
            self.y += this.getLengthDirectionY(this.speed, this.direction);
        }
    }

    private getLengthDirectionX(length: number, direction: number): number {
        return length * Math.cos(direction * (Math.PI / 180));
    }

    private getLengthDirectionY(length: number, direction: number) {
        return length * Math.sin(direction * (Math.PI / 180));
    }
}
