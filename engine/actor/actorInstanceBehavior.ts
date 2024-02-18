import { ActorLifecycleCallback } from './actor';
import { ActorInstance } from './actorInstance';
import { GameState } from './../game';
import { Geometry } from './../util';

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
            let newX = Geometry.getLengthDirectionX(this.speed, this.direction);
            let newY = Geometry.getLengthDirectionY(this.speed, this.direction);

            if (!self.actor.boundary) {
                self.x += newX;
                self.y += newY;
                return;
            }

            const instancesAtNewPosition = self.layer.getInstancesWithinBoundaryAtPosition(self.actor.boundary, self.x + newX, self.y + newY, true);
            let freeAtNewPositionX = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
            let freeAtNewPositionY = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + newY)));

            /** . */
            const maxChecks = Math.floor(this.speed /2);
            let current = 1;
            while (current < maxChecks && !freeAtNewPositionX && Math.abs(newX - self.x) > 1) {
                current++;
                if (newX > self.x) { 
                    newX -= 1; 
                }
                else { 
                    newX += 1; 
                }

                freeAtNewPositionX = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
            }

            current = 1;
            while (current < maxChecks && !freeAtNewPositionY && Math.abs(newY - self.y) > 1) {
                current++;
                if (newY > self.y) { 
                    newY -= 1; 
                }
                else { 
                    newY += 1; 
                }
                
                freeAtNewPositionY = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + newY)));
            }

            /** . */

            if (freeAtNewPositionX) {
                self.x += newX;
            }
            if (freeAtNewPositionY) {
                self.y += newY;
            }
        }
    }

    afterStep(self: ActorInstance, state: GameState): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            for (const actorName of self.actor.getCollisionActorNames()) {
                const otherInstances = self.layer.getInstances(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        self.actor.callCollision(self, other, state);
                    }
                }
            }
        }
    }
}
