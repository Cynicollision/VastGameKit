import { Geometry } from './../../core/geometry';
import { SceneController } from './../../scene/controller';
import { ActorBehavior } from './../actor';
import { ActorInstance } from './../instance';

export class ActorMotionBehavior implements ActorBehavior {
    direction: number = 0;
    speed: number = 0;
    previousX: number = 0;
    previousY: number = 0;

    beforeStep(self: ActorInstance, sc: SceneController): void {
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

            const instancesAtNewPosition = self.scene.getInstancesWithinBoundaryAtPosition(self.actor.boundary, self.x + newX, self.y + newY, true);
            let freeAtNewPositionX = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
            let freeAtNewPositionY = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + newY)));

            const maxChecks = this.speed;
            let current = 1;
            while (current < maxChecks && !freeAtNewPositionX && Math.abs(newX) > 1) {
                newX += self.x + newX > self.x ? -1 : 1;
                newX = Math.round(newX);
                freeAtNewPositionX = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
                current++;
            }

            current = 1;
            while (current < maxChecks && !freeAtNewPositionY && Math.abs(newY) > 1) { 
                newY += self.y + newY > self.y ? -1 : 1;
                newY = Math.round(newY);
                freeAtNewPositionY = !instancesAtNewPosition.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + newY)));
                current++;
            }

            if (freeAtNewPositionX && newX !== 0) {
                self.x = Math.round(self.x + Math.round(newX));
            }
            if (freeAtNewPositionY && newY !== 0) {
                self.y = Math.round(self.y + Math.round(newY));
            }
        }
    }

    afterStep(self: ActorInstance, sc: SceneController): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            for (const actorName of self.actor.getCollisionActorNames()) {
                const otherInstances = self.scene.getInstances(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        self.actor.callCollision(self, other, sc);
                    }
                }
            }
        }
    }
}