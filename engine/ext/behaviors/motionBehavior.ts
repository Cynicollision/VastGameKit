import { Geometry } from './../../core';
import { SceneController } from './../../controller';
import { ActorBehavior } from './../../actor';
import { ActorInstance } from './../../actorInstance';

export class ActorMotionBehavior implements ActorBehavior {
    direction: number = 0;
    speed: number = 0;
    previousX: number = 0;
    previousY: number = 0;

    beforeStep(self: ActorInstance, sc: SceneController): void {
        this.previousX = self.x;
        this.previousY = self.y;

        if (this.speed !== 0) {
            let newX = Math.round(Geometry.getLengthDirectionX(this.speed * 10, this.direction) / 10);
            let newY = Math.round(Geometry.getLengthDirectionY(this.speed * 10, this.direction) / 10);

            if (!self.actor.boundary) {
                self.x += newX;
                self.y += newY;
                return;
            }

            let instancesAtNewPositionX = sc.scene.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x + newX, self.y, true);
            let freeAtNewPositionX = !instancesAtNewPositionX.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
            
            let instancesAtNewPositionY = sc.scene.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x, self.y + newY, true);
            let freeAtNewPositionY = !instancesAtNewPositionY.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + newY)));

            if (freeAtNewPositionX && freeAtNewPositionY) {
                self.x += newX;
                self.y += newY;
                return;
            }

            // move as close to the nearest solid Boundary as possible.
            const newXSign = newX / Math.abs(newX);
            const newYSign = newY / Math.abs(newY);
            let tryNewX = newX !== 0 ? newXSign : 0;
            let tryNewY = newY !== 0 ? newYSign : 0;

            if (tryNewX !== 0 && !freeAtNewPositionX) {
                for (let i = 1; i < Math.abs(newX); i++) {
                    instancesAtNewPositionX = sc.scene.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x + tryNewX, self.y, true);
                    freeAtNewPositionX = !instancesAtNewPositionX.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + tryNewX, self.y)));
                    if (!freeAtNewPositionX) {
                        break;
                    }
                    newX = tryNewX;
                    tryNewX += newXSign;
                }
            }
            
            if (tryNewY !== 0 && !freeAtNewPositionY) {
                for (let i = 1; i < Math.abs(newY); i++) {
                    instancesAtNewPositionY = sc.scene.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x, self.y + tryNewY, true);
                    freeAtNewPositionY = !instancesAtNewPositionY.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x, self.y + tryNewY)));
                    if (!freeAtNewPositionY) {
                        break;
                    }
                    newY = tryNewY;
                    tryNewY += newYSign;
                }
            }

            if (freeAtNewPositionX && newX !== 0) {
                self.x += newX;
            }
            if (freeAtNewPositionY && newY !== 0) {
                self.y += newY;
            }
        }
    }

    afterStep(self: ActorInstance, sc: SceneController): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            for (const actorName of self.actor.getCollisionActorNames()) {
                const otherInstances = sc.scene.instances.getAll(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        self.actor.callCollision(self, other, sc);
                    }
                }
            }
        }
    }
}