import { ActorLifecycleCallback } from './actor';

export { ActorMotionBehavior } from './behaviors/motionBehavior';

export enum ActorBehaviorName {
    BasicMotion = 'BasicMotion',
}

// TODO rename -> InstanceBehavior OR make assignable at Actor level as well?
export type ActorBehavior = {
    beforeStep?: ActorLifecycleCallback;
    afterStep?: ActorLifecycleCallback;
};
