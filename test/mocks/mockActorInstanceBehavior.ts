import { ActorInstance } from './../../engine/actor/instance';
import { ActorBehavior } from './../../engine/actor/behavior';
import { SceneController } from '../../engine/scene/controller';

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