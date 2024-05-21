import { ActorInstance, ActorInstanceBehavior } from './../../engine/actor';
import { GameController } from './../../engine/game';

export class MockActorInstanceBehavior implements ActorInstanceBehavior {
    beforeStepCallCount = 0;
    afterStepCallCount = 0;

    beforeStep(self: ActorInstance, gc: GameController): void {
       this.beforeStepCallCount++;
    }

    afterStep(self: ActorInstance, gc: GameController): void {
        this.afterStepCallCount++;
    }
}