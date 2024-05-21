import { ActorLifecycleCallback } from './actor';

export { ActorMotionBehavior } from './behaviors/motionBehavior';

export enum ActorBehaviorName {
    BasicMotion = 'BasicMotion',
}

export type ActorBehavior = {
    beforeStep?: ActorLifecycleCallback;
    afterStep?: ActorLifecycleCallback;
};
