import { Direction } from './../../engine/core';
import { Game } from './../../engine/game';
import Constants from './../constants';

export function buildPlayerActor(game: Game) {

    const actPlayer = game.construction.defineActor('actPlayer', { 
        sprite: game.construction.getSprite('sprLink'),
    });

    actPlayer.setRectBoundaryFromSprite();
    actPlayer.useBasicMotionBehavior();

    actPlayer.onCreate((self, sc) => {
        self.depth = -20;
        self.state.stats = { health: 100 };
    });

    actPlayer.onCollision('actCoin', (self, other, sc) => {
        other.destroy();
    });
    
    actPlayer.onKeyboardInput('w', (self, ev, sc) => {
        self.state.moveUp = ev.type === 'keydown';
    });

    actPlayer.onKeyboardInput('a', (self, ev, sc) => {
        self.state.moveLeft = ev.type === 'keydown';
    });

    actPlayer.onKeyboardInput('s', (self, ev, sc) => {
        self.state.moveDown = ev.type === 'keydown';
    });

    actPlayer.onKeyboardInput('d', (self, ev, sc) => {
        self.state.moveRight = ev.type === 'keydown';
    });

    actPlayer.onPointerInput('mousedown', (self, ev, sc) => {
        console.log('you clicked me');
        sc.publishEvent('something', { foo: 'bar'});
    });

    actPlayer.onStep((self, controller) => {
        if (self.state.moveUp || self.state.moveLeft || self.state.moveRight || self.state.moveDown) {
            self.motion.speed = 1;
        }
        else {
            self.motion.speed = 0;
        }
    
        if (self.state.moveUp && self.state.moveLeft) {
            self.motion.direction = 225;
        }
        else if (self.state.moveUp && self.state.moveRight) {
            self.motion.direction = 315;
        }
        else if (self.state.moveDown && self.state.moveLeft) {
            self.motion.direction = 135;
        }
        else if (self.state.moveDown && self.state.moveRight) {
            self.motion.direction = 45;
        }
        else if (self.state.moveUp) {
            self.motion.direction = Direction.Up;
        }
        else if (self.state.moveLeft) {
            self.motion.direction = Direction.Left;
        }
        else if (self.state.moveRight) {
            self.motion.direction = Direction.Right;
        }
        else if (self.state.moveDown) {
            self.motion.direction = Direction.Down;
        }

        // TODO: "gameWorld" script(s)
        const sceneHeight = controller.sceneState.scene.height;
        const sceneWidth= controller.sceneState.scene.width;
        const threshold = 16;
        const placementOffset = 4;
        if (self.y < 0) {
            if (controller.sceneState.scene.name === 'scnAreaB1') {
                const nextRoom = 'scnAreaA1';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: self.x, playerY: sceneHeight - threshold - placementOffset });
            }
            else if (controller.sceneState.scene.name === 'scnAreaB2') {
                const nextRoom = 'scnAreaA2';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: self.x, playerY: sceneHeight - threshold - placementOffset });
            }
        }
        else if (self.y > sceneHeight - threshold) {
            if (controller.sceneState.scene.name === 'scnAreaA1') {
                const nextRoom = 'scnAreaB1';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: self.x, playerY: placementOffset });
            }
            else if (controller.sceneState.scene.name === 'scnAreaA2') {
                const nextRoom = 'scnAreaB2';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: self.x, playerY: placementOffset });
            }
        }
        else if (self.x < 0) {
            if (controller.sceneState.scene.name === 'scnAreaA2') {
                const nextRoom = 'scnAreaA1';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: sceneWidth - threshold - placementOffset, playerY: self.y });
            }
            else if (controller.sceneState.scene.name === 'scnAreaB2') {
                const nextRoom = 'scnAreaB1';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: sceneWidth - threshold - placementOffset, playerY: self.y });
            }
        }
        else if (self.x > sceneWidth - threshold) {
            if (controller.sceneState.scene.name === 'scnAreaA1') {
                const nextRoom = 'scnAreaA2';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: placementOffset, playerY: self.y });
            }
            else if (controller.sceneState.scene.name === 'scnAreaB1') {
                const nextRoom = 'scnAreaB2';
                controller.transitionToScene(nextRoom, { durationMs: 800, portY: Constants.HUDHeight }, { playerX: placementOffset, playerY: self.y });
            }
        }
    });

    actPlayer.onDraw((self, canvas, sc) => {
        canvas.drawText(`(${self.x},${self.y})`, self.x + 32, self.y + 10);
    });
}