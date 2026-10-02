import { Boundary, InstanceStatus, ObjMap, RuntimeID, SpatialGrid } from './../core';
import { GameCanvas } from './../device/canvas';
import { TileMap } from './../resources/tilemap';
import { ActorDefinition } from './../structure/actor';

import { SceneController } from './controller';
import { Instance, ActorInstanceOptions, ActorInstance } from './instance';

export type SceneView = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class SceneInstanceState {
    private static readonly NoInstances: readonly ActorInstance[] = [];

    private readonly controller: SceneController;
    private readonly grid = new SpatialGrid<ActorInstance>();

    // in creation order.
    private instances: ActorInstance[] = [];
    private instancesByActor = new Map<string, ActorInstance[]>();

    private drawOrder: ActorInstance[] = [];
    private drawOrderChanged = false;

    constructor(controller: SceneController) {
        this.controller = controller;
    }

    private static byId(a: Instance, b: Instance): number {
        return a.id - b.id;
    }

    // Higher depth draws first, so lower depth appears on top.
    private static byDrawOrder(a: Instance, b: Instance): number {
        return b.depth - a.depth || a.id - b.id;
    }

    private static isCandidate(instance: ActorInstance, solid: boolean, exclude?: Instance): boolean {
        return instance !== exclude && instance.status !== InstanceStatus.Destroyed && (!solid || instance.actor.solid);
    }

    private removeAll(removed: Set<ActorInstance>): void {
        const isKept = (instance: ActorInstance): boolean => !removed.has(instance);

        this.instances = this.instances.filter(isKept);
        this.drawOrder = this.drawOrder.filter(isKept);
        this.instancesByActor.forEach((instances, actorName) => this.instancesByActor.set(actorName, instances.filter(isKept)));
    }

    private updateGrid(instance: ActorInstance): void {
        const boundary = instance.actor.boundary;

        if (boundary) {
            this.grid.update(instance, instance.x + boundary.originX, instance.y + boundary.originY, boundary.width, boundary.height);
        }
        else {
            this.grid.remove(instance);
        }
    }

    create(actorName: string, options?: ActorInstanceOptions): Instance {
        const actor = <ActorDefinition>this.controller.gameConstruction.actors.get(actorName);
        const newInstance = new ActorInstance(RuntimeID.next(), actor, this, options);

        this.instances.push(newInstance);
        this.drawOrder.push(newInstance);
        this.drawOrderChanged = true;

        const actorInstances = this.instancesByActor.get(actorName);
        if (actorInstances) {
            actorInstances.push(newInstance);
        }
        else {
            this.instancesByActor.set(actorName, [newInstance]);
        }

        this.updateGrid(newInstance);

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

    // Creates an Instance for each non-empty tile in a TileMap tile layer, of the given Actor or the Actor
    // returned for the tile's global id (undefined skips the tile).
    createFromTileLayer(map: TileMap, layerName: string, actor: string | ((gid: number) => string | undefined)): Instance[] {
        const layer = map.getLayer(layerName);
        const instances = [];

        for (let row = 0; row < layer.height; row++) {
            for (let column = 0; column < layer.width; column++) {
                const gid = layer.tiles[row * layer.width + column];
                const actorName = gid === 0 ? undefined : typeof actor === 'string' ? actor : actor(gid);

                if (actorName) {
                    const x = layer.offsetX + column * map.tileWidth;
                    const y = layer.offsetY + row * map.tileHeight;
                    instances.push(this.create(actorName, { x: x, y: y }));
                }
            }
        }

        return instances;
    }

    // Creates an Instance for each object in a TileMap object layer. Without an actorKey, each object's class names
    // its Actor (objects without a class are skipped). With one, actorKey[class] names it, and objects whose class
    // isn't in the key are skipped. Object properties are copied to the Instance's state.
    createFromTileMapObjects(map: TileMap, layerName: string, actorKey?: ObjMap<string>): Instance[] {
        const instances = [];

        for (const object of map.getObjectLayer(layerName).objects) {
            const actorName = actorKey ? actorKey[object.type] : object.type;

            if (actorName) {
                const instance = this.create(actorName, { x: object.x, y: object.y });
                Object.assign(instance.state, object.properties);
                instances.push(instance);
            }
        }

        return instances;
    }

    // Draws Instances by depth. Given a view, only Instances that may be visible within it are drawn.
    draw(canvas: GameCanvas, controller: SceneController, view?: SceneView): void {
        if (this.drawOrderChanged) {
            this.drawOrder.sort(SceneInstanceState.byDrawOrder);
            this.drawOrderChanged = false;
        }

        for (const instance of this.drawOrder) {
            if (!view || instance.isVisibleIn(view.x, view.y, view.width, view.height)) {
                instance.draw(canvas, controller);
            }
        }
    }

    forEach(callback: (self: Instance) => void): void {
        // Instances created by the callback aren't included.
        const instances = this.instances;
        const count = instances.length;

        for (let i = 0; i < count; i++) {
            callback(instances[i]);
        }
    }

    // Returns Instances in creation order, including destroyed Instances until they're removed next step.
    getAll(actorName?: string): readonly Instance[] {
        if (actorName === undefined) {
            return this.instances;
        }

        return this.instancesByActor.get(actorName) || SceneInstanceState.NoInstances;
    }

    getAtPosition(x: number, y: number, solid: boolean = false): Instance[] {
        const instances: ActorInstance[] = [];

        // containment includes the far edges, so look slightly beyond the position.
        this.grid.forEachNear(x - 1, y - 1, 2, 2, instance => {
            if (SceneInstanceState.isCandidate(instance, solid) && instance.actor.boundary && instance.actor.boundary.containsPositionAt(instance.x, instance.y, x, y)) {
                instances.push(instance);
            }
        });

        return instances.sort(SceneInstanceState.byId);
    }

    // Instances near the given Instance that it may be colliding with, in creation order.
    getCollisionCandidates(instance: ActorInstance): ActorInstance[] {
        const boundary = instance.actor.boundary;
        const candidates: ActorInstance[] = [];

        if (boundary) {
            this.grid.forEachNear(instance.x + boundary.originX, instance.y + boundary.originY, boundary.width, boundary.height, other => {
                if (other !== instance) {
                    candidates.push(other);
                }
            });
        }

        return candidates.sort(SceneInstanceState.byId);
    }

    getWithinBoundaryAtPosition(boundary: Boundary, x: number, y: number, solid: boolean = false, exclude?: Instance): Instance[] {
        const instances: ActorInstance[] = [];

        this.grid.forEachNear(x + boundary.originX, y + boundary.originY, boundary.width, boundary.height, instance => {
            if (SceneInstanceState.isCandidate(instance, solid, exclude) && instance.actor.boundary && instance.actor.boundary.collidesAt(instance.x, instance.y, boundary, x, y)) {
                instances.push(instance);
            }
        });

        return instances.sort(SceneInstanceState.byId);
    }

    // Whether a Boundary placed at the position overlaps no Instances, other than the excluded one.
    isAreaFree(boundary: Boundary, x: number, y: number, solid: boolean = false, exclude?: Instance): boolean {
        let free = true;

        this.grid.forEachNear(x + boundary.originX, y + boundary.originY, boundary.width, boundary.height, instance => {
            if (free && SceneInstanceState.isCandidate(instance, solid, exclude) && instance.actor.boundary && instance.actor.boundary.collidesAt(instance.x, instance.y, boundary, x, y)) {
                free = false;
            }
        });

        return free;
    }

    isPositionFree(x: number, y: number, solid: boolean = false): boolean {
        let free = true;

        this.grid.forEachNear(x - 1, y - 1, 2, 2, instance => {
            if (free && SceneInstanceState.isCandidate(instance, solid) && instance.actor.boundary && instance.actor.boundary.containsPositionAt(instance.x, instance.y, x, y)) {
                free = false;
            }
        });

        return free;
    }

    onDepthChanged(): void {
        this.drawOrderChanged = true;
    }

    onMoved(instance: ActorInstance): void {
        if (instance.status !== InstanceStatus.Destroyed) {
            this.updateGrid(instance);
        }
    }

    step(controller: SceneController): void {
        // Instances created during this step are first stepped next step.
        const instances = this.instances;
        const count = instances.length;
        let removed: Set<ActorInstance> | undefined;

        for (let i = 0; i < count; i++) {
            const instance = instances[i];

            if (instance.status === InstanceStatus.Destroyed) {
                this.grid.remove(instance);
                removed = removed || new Set<ActorInstance>();
                removed.add(instance);
                instance.actor.callDestroy(instance, controller);
            }
            else if (instance.status === InstanceStatus.New) {
                instance.activate();
                this.updateGrid(instance);
                instance.actor.callCreate(instance, controller);
            }
            else if (instance.status === InstanceStatus.Active) {
                // picks up Boundary changes made to the Instance's Actor.
                this.updateGrid(instance);
                instance.step(controller);
            }
        }

        if (removed) {
            this.removeAll(removed);
        }
    }
}
