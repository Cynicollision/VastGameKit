import { Instance } from './../../engine/actorInstance';
import { ActorBehavior } from './../../engine/actor';
import { Controller } from './../../engine/controller';

export class MockActorInstanceBehavior implements ActorBehavior {
    beforeStepCallCount = 0;
    afterStepCallCount = 0;

    beforeStep(self: Instance, gc: Controller): void {
       this.beforeStepCallCount++;
    }

    afterStep(self: Instance, gc: Controller): void {
        this.afterStepCallCount++;
    }
}