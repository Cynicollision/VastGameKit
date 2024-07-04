import { Boundary, InstanceStatus, ObjMap } from './../core';
import { GameCanvas } from './../device/canvas';
import { ActorDefinition } from './../structure/actor';

import { SceneController } from './controller';
import { Instance, ActorInstanceOptions, ActorInstance } from './instance';

export class SceneInstanceState {
    private readonly controller: SceneController;
    private instanceMap: ObjMap<ActorInstance> = {};

    constructor(controller: SceneController) {
        this.controller = controller;
    }

    private delete(instance: Instance): void {
        delete this.instanceMap[instance.id];
    }

    private getByDepthAsc(actorName?: string): Instance[] {
        return this.getAll(actorName).sort((a, b) => { return b.depth - a.depth; });
    }

    // TODO: move x, y back to ActorInstanceOptions for consistency w/ SubScenes
    create(actorName: string, options?: ActorInstanceOptions): Instance {
        const actor = <ActorDefinition>this.controller.gameConstruction.getActor(actorName);
        const newInstance = actor.newInstance(options);
        this.instanceMap[newInstance.id] = newInstance;

        return newInstance;
    }

    createFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): Instance[] {
        const instances = [];

        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                const actorName = instanceKey[map[i][j]];
                if (actorName) {
                    instances.push(this.create(actorName, { x: j * gridSize, y: i * gridSize }));
                }
            }
        }

        return instances;
    }

    draw(canvas: GameCanvas, controller: SceneController): void {
        for (const instance of <ActorInstance[]>this.getByDepthAsc()) {
            instance.draw(canvas, controller);
        }
    }

    forEach(callback: (self: Instance) => void): void {
        for (const a in this.instanceMap) {
            callback(this.instanceMap[a]);
        }
    }

    getAll(actorName?: string): Instance[] {
        const instances: ActorInstance[] = [];

        for (const instanceId in this.instanceMap) {
            const instance = this.instanceMap[instanceId];
            if (!actorName || actorName === instance.actor.name) {
                instances.push(this.instanceMap[instanceId]);
            }
        }

        return instances;
    }

    getAtPosition(x: number, y: number, solid: boolean = false): Instance[] {
        const instances = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    getWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid: boolean = false): Instance[] {
        const instances = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).collidesWith(boundary.atPosition(x, y))) {
                if (!solid || solid && instance.actor.solid) {
                    instances.push(instance);
                }
            }
        }

        return instances;
    }

    isPositionFree(x: number, y: number, solid: boolean = false): boolean {
        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.actor.boundary && instance.actor.boundary.atPosition(instance.x, instance.y).containsPosition(x, y)) {
                return !(!solid || solid && instance.actor.solid);
            }
        }

        return true;
    }

    step(controller: SceneController): void {
        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.status === InstanceStatus.Destroyed) {
                this.delete(instance);
                instance.actor.callDestroy(instance, controller);
            }
            else if (instance.status === InstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, controller);
            }
            else if (instance.status === InstanceStatus.Active) {
                instance.callBeforeStepBehaviors(controller);
                instance.step(controller);
                instance.callAfterStepBehaviors(controller);
            }
        }
    }
}