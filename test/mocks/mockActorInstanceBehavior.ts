import { Instance } from './../../engine/actor/instance';
import { ActorBehavior } from './../../engine/actor/actor';
import { Controller } from './../../engine/scene/controller';

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