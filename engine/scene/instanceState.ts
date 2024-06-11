import { Boundary, InstanceStatus, ObjMap, RuntimeID } from './../core';
import { GameCanvas } from '../device/canvas';
import { ActorDefinition } from './../actor';
import { Instance, ActorInstanceOptions, ActorInstance } from './../actorInstance';
import { Controller } from '../controller';
import { GameResources } from './../resources';

export class SceneInstanceState {
    private readonly resources: GameResources;
    private instanceMap: ObjMap<ActorInstance> = {};

    constructor(resources: GameResources) {
        this.resources = resources;
    }

    private delete(instance: Instance): void {
        delete this.instanceMap[instance.id];
    }

    private getByDepth(actorName?: string): Instance[] {
        return this.getAll(actorName).sort((a, b) => { return b.depth - a.depth; });
    }

    draw(canvas: GameCanvas, sc: Controller): void {
        for (const instance of <ActorInstance[]>this.getByDepth()) {
            instance.draw(canvas, sc);
        }
    }

    create(actorName: string, options?: ActorInstanceOptions): Instance {
        const instanceId = RuntimeID.next();
        const actor = <ActorDefinition>this.resources.getActor(actorName);

        const newInstance = <ActorInstance>ActorInstance.spawn(instanceId, actor, options);
        this.instanceMap[instanceId] = newInstance;

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

    step(sc: Controller): void {
        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (instance.status === InstanceStatus.Destroyed) {
                this.delete(instance);
                instance.actor.callDestroy(instance, sc);
            }
            else if (instance.status === InstanceStatus.New) {
                instance.activate();
                instance.actor.callCreate(instance, sc);
            }
            else if (instance.status === InstanceStatus.Active) {
                instance.callBeforeStepBehaviors(sc);
                instance.step(sc);
                instance.callAfterStepBehaviors(sc);
            }
        }
    }
}