import { Boundary, ObjMap, RuntimeID } from './../core';
import { Actor } from './../actor';
import { ActorInstance, ActorInstanceOptions, Instance } from './../actorInstance';
import { GameResources } from './../resources';

export class SceneInstanceState {
    private readonly resources: GameResources;
    private instanceMap: ObjMap<Instance> = {};

    constructor(resources: GameResources) {
        this.resources = resources;
    }

    create(actorName: string, options?: ActorInstanceOptions): ActorInstance {
        const instanceId = RuntimeID.next();
        const actor = <Actor>this.resources.getActor(actorName);

        const newInstance = <Instance>Instance.spawn(instanceId, actor, options);
        this.instanceMap[instanceId] = newInstance;

        return newInstance;
    }

    createFromMap(gridSize: number, map: string[], instanceKey: {[char: string]: string }): ActorInstance[] {
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

    delete(instance: ActorInstance): void {
        delete this.instanceMap[instance.id];
    }

    getAll(actorName?: string): ActorInstance[] {
        const instances: Instance[] = [];

        for (const a in this.instanceMap) {
            const instance = this.instanceMap[a];
            if (!actorName || actorName === instance.actor.name) {
                instances.push(this.instanceMap[a]);
            }
        }

        return instances;
    }

    getAtPosition(x: number, y: number, solid: boolean = false): ActorInstance[] {
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

    getByDepth(actorName?: string): ActorInstance[] {
        return this.getAll(actorName).sort((a, b) => { return b.depth - a.depth; });
    }

    getWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid: boolean = false): ActorInstance[] {
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
}