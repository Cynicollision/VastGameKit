import { Direction, SceneTransitionType } from './../../engine/core';
import { Game } from './../../engine/game';

export function buildPlayerActor(game: Game) {

    const actPlayer = game.construct.defineActor('actPlayer', { 
        sprite: game.construct.getSprite('sprLink'),
    });

    actPlayer.setRectBoundaryFromSprite();
    actPlayer.useBasicMotionBehavior();

    actPlayer.onCreate((self, sc) => {
        self.state.stats = { health: 100 };
    });

    actPlayer.onGameEvent('something', (self, ev, sc) => {
        const nextRoom = sc.sceneState.scene.name === 'default' ? 'room1' : 'default';
        sc.transitionToScene(nextRoom, { durationMs: 800, portY: 120 }, { foo: 'bar123' });
        ev.cancel();
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

    actPlayer.onStep((self, sc) => {
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
    });

    actPlayer.onDraw((self, canvas, sc) => {
        canvas.drawText(`(${self.x},${self.y})`, self.x + 32, self.y + 10);
    });
}