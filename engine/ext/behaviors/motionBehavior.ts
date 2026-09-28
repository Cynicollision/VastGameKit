import { Geometry } from './../../core';
import { ActorBehavior, ActorDefinition } from './../../structure/actor';
import { Controller } from './../../state/controller';
import { Instance } from './../../state/instance';

export class ActorMotionBehavior implements ActorBehavior {
    direction: number = 0;
    speed: number = 0;
    previousX: number = 0;
    previousY: number = 0;

    // Returns the furthest distance, up to the given distance, that can be moved along one axis.
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

    beforeStep(self: Instance, controller: Controller): void {
        this.previousX = self.x;
        this.previousY = self.y;

        if (this.speed === 0) {
            return;
        }

        const round = true; // TODO: param or game config
        let moveX = Geometry.getLengthDirectionX(this.speed, this.direction);
        let moveY = Geometry.getLengthDirectionY(this.speed, this.direction);
        moveX = round ? Math.round(moveX) : moveX;
        moveY = round ? Math.round(moveY) : moveY;

        const boundary = self.actor.boundary;
        if (!boundary) {
            self.x += moveX;
            self.y += moveY;
            return;
        }

        const instances = controller.sceneState.instances;
        const isFreeAt = (x: number, y: number): boolean => instances.getWithinBoundaryAtPosition(boundary, x, y, true, self).length === 0;

        // Resolve each axis separately, moving as close to any solid Boundary as possible.
        self.x += ActorMotionBehavior.getAllowedDistance(moveX, distance => isFreeAt(self.x + distance, self.y));
        self.y += ActorMotionBehavior.getAllowedDistance(moveY, distance => isFreeAt(self.x, self.y + distance));
    }

    afterStep(self: Instance, controller: Controller): void {
        if (this.previousX !== self.x || this.previousY !== self.y) {
            const actor = <ActorDefinition>self.actor;
            for (const actorName of actor.getCollisionActorNames()) {
                const otherInstances = controller.sceneState.instances.getAll(actorName);
                for (const other of otherInstances) {
                    if (self !== other && self.collidesWith(other)) {
                        actor.callCollision(self, other, controller);
                    }
                }
            }
        }
    }
}