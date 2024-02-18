import { ActorInstance, ActorInstanceBehavior } from './../../engine/actor';
import { GameState } from './../../engine/game';

export class MockActorInstanceBehavior implements ActorInstanceBehavior {
    beforeStepCallCount = 0;
    afterStepCallCount = 0;

    beforeStep(self: ActorInstance, state: GameState): void {
       this.beforeStepCallCount++;
    }

    afterStep(self: ActorInstance, state: GameState): void {
        this.afterStepCallCount++;
    }
}