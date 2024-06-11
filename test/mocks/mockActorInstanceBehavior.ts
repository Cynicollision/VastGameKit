import { ActorBehavior } from './../../engine/actor';
import { ActorInstance } from './../../engine/actorInstance';
import { SceneController } from './../../engine/controller';

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