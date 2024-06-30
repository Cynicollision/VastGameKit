import { ActorBehavior } from './../../engine/structure/actor';
import { ActorInstance } from './../../engine/state/instance';
import { SceneController } from './../../engine/state/controller';

export class MockActorInstanceBehavior implements ActorBehavior {
    beforeStepCallCount = 0;
    afterStepCallCount = 0;

    beforeStep(self: ActorInstance, gc: SceneController): void {
       this.beforeStepCallCount++;
    }

    afterStep(self: ActorInstance, gc: SceneController): void {
        this.afterStepCallCount++;
    }
}