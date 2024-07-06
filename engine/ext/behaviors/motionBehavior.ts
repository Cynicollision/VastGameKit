import { Geometry } from './../../core';
import { ActorBehavior } from './../../structure/actor';
import { Controller } from './../../state/controller';
import { ActorInstance } from './../../state/instance';

export class ActorMotionBehavior implements ActorBehavior {
    direction: number = 0;
    speed: number = 0;
    previousX: number = 0;
    previousY: number = 0;

    beforeStep(self: ActorInstance, controller: Controller): void {
        this.previousX = self.x;
        this.previousY = self.y;

        const round = true; // TODO: param or game config

        if (this.speed !== 0) {
            let newX = Geometry.getLengthDirectionX(this.speed, this.direction);
            let newY = Geometry.getLengthDirectionY(this.speed, this.direction);
            newX = round ? Math.round(newX) : newX;
            newY = round ? Math.round(newY) : newY;

            if (!self.actor.boundary) {
                self.x += newX;
                self.y += newY;
                return;
            }

            let instancesAtNewPositionX = controller.sceneState.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x + newX, self.y, true);
            let freeAtNewPositionX = !instancesAtNewPositionX.some(instance => instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(self.actor.boundary.atPosition(self.x + newX, self.y)));
            
            let instancesAtNewPositionY = controller.sceneState.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x, self.y + newY, true);
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
                    instancesAtNewPositionX = controller.sceneState.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x + tryNewX, self.y, true);
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
                    instancesAtNewPositionY = controller.sceneState.instances.getWithinBoundaryAtPosition(self.actor.boundary, self.x, self.y + tryNewY, true);
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

    afterStep(self: ActorInstance, controller: Controller): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            for (const actorName of self.actor.getCollisionActorNames()) {
                const otherInstances = controller.sceneState.instances.getAll(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        self.actor.callCollision(self, other, controller);
                    }
                }
            }
        }
    }
}