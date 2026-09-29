import { Controller, Game, Instance, Scene, SceneState } from './../../engine';
import Constants from './../constants';

// The areas form a grid the player walks between: leaving one area's edge enters the next area's opposite edge.
const AreaGrid = [
    ['scnAreaA1', 'scnAreaA2'],
    ['scnAreaB1', 'scnAreaB2'],
];

type AreaDefinition = {
    name: string;
    width: number;
    height: number;
    background: string;
    // one character per 16px: X is a wall.
    map: string[];
};

const Areas: AreaDefinition[] = [
    {
        name: 'scnAreaA1',
        width: 960,
        height: 640,
        background: 'bgAreaA1',
        map: [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X    XXXXX                             X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X               X         X            X',
            'X                         X            X',
            'X                                      X',
            'X                                       ',
            'X          X                            ',
            'X                                       ',
            'X                                      X',
            'X                                      X',
            'X                   X                  X',
            'X                                      X',
            'X                                      X',
            'X           XX                  X      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                       X              X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX',
        ],
    },
    {
        name: 'scnAreaA2',
        width: 640,
        height: 480,
        background: 'sprGrass',
        map: [
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X       X                              X',
            '        X                              X',
            '        X                              X',
            '        X                              X',
            'X       X                              X',
            'X       X                              X',
            'X                                      X',
            'X          X                           X',
            'X                                      X',
            'X              X                       X',
            'X                                      X',
            'X                                      X',
            'X           XXXXXXXXXXXX               X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX',
        ],
    },
    {
        name: 'scnAreaB1',
        width: 640,
        height: 480,
        background: 'sprGrass',
        map: [
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                       X              X',
            'X                       X              X',
            'X                       X              X',
            'X             XXXXXXXXXXX              X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                             XXXXXXXXXX',
            'X                                       ',
            'X                                       ',
            'X                                       ',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        ],
    },
    {
        name: 'scnAreaB2',
        width: 640,
        height: 480,
        background: 'sprGrass',
        map: [
            'XXXXXXXXXXXXXXXXXX   XXXXXXXXXXXXXXXXXXX',
            'X                                      X',
            'X                 XXXXX                X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            '                                       X',
            '   X                                   X',
            '                                       X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'X                                      X',
            'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        ],
    },
];

type AreaEntry = {
    playerX: number;
    playerY: number;
};

function initArea(game: Game, area: SceneState, entry: AreaEntry): void {
    const player = area.instances.create('actPlayer', { x: entry.playerX, y: entry.playerY });
    area.floatSubScene('scnHUD', { x: 0, y: 0, width: game.canvas.width });

    const scale = 4;
    area.defaultCamera.height = (game.canvas.height - Constants.HUDHeight) / scale;
    area.defaultCamera.width = game.canvas.width / scale;
    area.defaultCamera.portWidth = area.defaultCamera.width * scale;
    area.defaultCamera.portHeight = area.defaultCamera.height * scale;
    area.defaultCamera.portY = Constants.HUDHeight;
    area.defaultCamera.follow(player, { centerOnTarget: true });
}

function setupAreaInput(game: Game, area: Scene): void {
    // opens a modal that pauses the area and the HUD.
    area.onKeyboardInput('m', (self, event, controller) => {
        if (event.type !== 'keydown' || self.state.openModal) {
            return;
        }

        const modalHeight = 640;
        const modalWidth = 960;

        self.state.openModal = controller.sceneState.floatSubScene('scnModal', {
            depth: -100,
            height: modalHeight,
            width: modalWidth,
            x: (game.canvas.width - modalWidth) / 2,
            y: (game.canvas.height - modalHeight) / 2,
        });
        self.paused = true;
        controller.state.hud.paused = true;
    });

    area.onKeyboardInput('e', (self, event, controller) => {
        if (event.type !== 'keydown' || !self.state.openModal) {
            return;
        }

        self.state.openModal.destroy();
        self.state.openModal = null;
        self.paused = false;
        controller.state.hud.paused = false;
    });
}

// Moves the player to the neighboring area when they walk off the current one's edge.
export function exitAreaAtEdge(player: Instance, controller: Controller): void {
    const scene = controller.sceneState.scene;
    const row = AreaGrid.findIndex(areas => areas.includes(scene.name));
    if (row < 0) {
        return;
    }
    const column = AreaGrid[row].indexOf(scene.name);

    // how far past an edge the player walks before leaving, and how far inside the next area's edge they enter.
    const threshold = 16;
    const inset = 4;
    let next: [number, number] | undefined;
    let entry: AreaEntry | undefined;

    if (player.y < 0) {
        next = [row - 1, column];
        entry = { playerX: player.x, playerY: scene.height - threshold - inset };
    }
    else if (player.y > scene.height - threshold) {
        next = [row + 1, column];
        entry = { playerX: player.x, playerY: inset };
    }
    else if (player.x < 0) {
        next = [row, column - 1];
        entry = { playerX: scene.width - threshold - inset, playerY: player.y };
    }
    else if (player.x > scene.width - threshold) {
        next = [row, column + 1];
        entry = { playerX: inset, playerY: player.y };
    }

    const nextArea = next && AreaGrid[next[0]] && AreaGrid[next[0]][next[1]];
    if (nextArea) {
        controller.transitionToScene(nextArea, { durationMs: 800, portY: Constants.HUDHeight }, entry);
    }
}

export function buildAreas(game: Game): void {
    for (const definition of Areas) {
        const area = game.construction.scenes.add(definition.name, { width: definition.width, height: definition.height, persistent: true });
        area.background.setFromSprite(game.construction.sprites.get(definition.background));
        setupAreaInput(game, area);

        area.onStart((self, controller, entry: AreaEntry) => {
            initArea(game, self, entry);
            self.instances.createFromMap(16, definition.map, { 'X': 'actWall' });
        });

        // persistent areas keep their state, so returning players are moved to where they entered.
        area.onResume((self, controller, entry: AreaEntry) => {
            self.instances.getAll('actPlayer').forEach(player => {
                player.x = entry.playerX;
                player.y = entry.playerY;
            });
        });
    }
}
