import { ActorLifecycleCallback } from './actor';

export enum ActorBehaviorName {
    BasicMotion = 'BasicMotion',
}

export type ActorBehavior = {
    beforeStep?: ActorLifecycleCallback;
    afterStep?: ActorLifecycleCallback;
};
