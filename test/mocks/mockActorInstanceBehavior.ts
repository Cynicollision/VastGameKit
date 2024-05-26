import { ActorInstance } from './../../engine/actor/instance';
import { ActorBehavior } from './../../engine/actor/behavior';
import { GameController } from './../../engine/game/controller';

export class MockActorInstanceBehavior implements ActorBehavior {
    beforeStepCallCount = 0;
    afterStepCallCount = 0;

    beforeStep(self: ActorInstance, gc: GameController): void {
       this.beforeStepCallCount++;
    }

    afterStep(self: ActorInstance, gc: GameController): void {
        this.afterStepCallCount++;
    }
}