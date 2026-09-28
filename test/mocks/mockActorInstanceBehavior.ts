import { ActorBehavior } from './../../engine/structure/actor';
import { Instance } from './../../engine/state/instance';
import { Controller } from './../../engine/state/controller';

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
