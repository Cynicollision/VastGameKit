import { ActorLifecycleCallback } from './actor';

export enum ActorInstanceBehaviorName {
    BasicMotion = 'BasicMotion',
}

export interface ActorInstanceBehavior {
    beforeStep: ActorLifecycleCallback;
    afterStep: ActorLifecycleCallback;
}
