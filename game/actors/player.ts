import { Game } from './../../engine/game';
import { Direction } from './../../engine/core';
import { SpriteTransformation } from './../../engine/sprite';

export function buildPlayerActor(game: Game) {
    
    game.defineActor('actPlayer', { 
        sprite: game.defineSprite('sprPlayer', './resources/granite.png') 
    })
    .useBasicMotionBehavior()
    .onLoad(player => {
        player.setRectBoundaryFromSprite();
    })
    .onCreate((self, gc) => {
        self.state.stats = { health: 100 };
        self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
        gc.state.message = ' :)';
    })
    .onGameEvent('something', (self, state, event) => {
        const nextRoom = state.currentScene.name === 'default' ? 'room1' : 'default';
        state.transitionToScene(nextRoom, { durationMs: 500 });
        event.cancel();
    })
    .onCollision('actCoin', (self, other, gc) => {
        //other.destroy();
    })
    .onKeyboardInput('w', (self, gc, ev) => {
        // TODO: define in (new) ActorKeyboardControlBehavior
        self.state.moveUp = ev.type === 'keydown';
    })
    .onKeyboardInput('a', (self, gc, ev) => {
        self.state.moveLeft = ev.type === 'keydown';
    })
    .onKeyboardInput('s', (self, gc, ev) => {
        self.state.moveDown = ev.type === 'keydown';
    })
    .onKeyboardInput('d', (self, gc, ev) => {
        self.state.moveRight = ev.type === 'keydown';
    })
    .onPointerInput('mousedown', (self, gc, ev) => {
        console.log('you clicked me');
        gc.raiseEvent('something', { foo: 'bar'});
    })
    .onStep((self, gc) => {
        // TODO: ActorKeyboardControlBehavior
        if (self.state.moveUp || self.state.moveLeft || self.state.moveRight || self.state.moveDown) {
            self.motion.speed = 6;
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
}