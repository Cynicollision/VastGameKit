import { Game } from './../../engine/game';
import { Direction } from './../../engine/actor';

export function buildPlayerActor(game: Game) {
    
    game.defineActor('actPlayer', { 
        sprite: game.defineSprite('sprPlayer', './resources/playerShip3_blue.png') 
    })
    .useBasicMotionBehavior()
    .onLoad(player => {
        player.setRectBoundaryFromSprite();
    })
    .onCreate((self, state) => {
        self.stats = { health: 100 };
        state.message = ' :)';
    })
    .onGameEvent('something', (self, state, event) => {
        state.goToRoom(state.currentRoom.name === 'default' ? 'room1' : 'default');
        event.cancel();
    })
    .onCollision('actCoin', (self, other, state) => {
        //other.destroy();
    })
    .onKeyboardInput('w', (self, state, event) => {
        self.moveUp = event.type === 'keydown';
    })
    .onKeyboardInput('a', (self, state, event) => {
        self.moveLeft = event.type === 'keydown';
    })
    .onKeyboardInput('s', (self, state, event) => {
        self.moveDown = event.type === 'keydown';
    })
    .onKeyboardInput('d', (self, state, event) => {
        self.moveRight = event.type === 'keydown';
    })
    .onPointerInput('mousedown', (self, state, event) => {
        console.log('you clicked me');
        state.raiseEvent('something', { foo: 'bar'});
    })
    .onStep((self, state) => {
        if (self.moveUp || self.moveLeft || self.moveRight || self.moveDown) {
            self.motion.speed = 6;
        }
        else {
            self.motion.speed = 0;
        }
    
        if (self.moveUp && self.moveLeft) {
            self.motion.direction = 225;
        }
        else if (self.moveUp && self.moveRight) {
            self.motion.direction = 315;
        }
        else if (self.moveDown && self.moveLeft) {
            self.motion.direction = 135;
        }
        else if (self.moveDown && self.moveRight) {
            self.motion.direction = 45;
        }
        else if (self.moveUp) {
            self.motion.direction = Direction.Up;
        }
        else if (self.moveLeft) {
            self.motion.direction = Direction.Left;
        }
        else if (self.moveRight) {
            self.motion.direction = Direction.Right;
        }
        else if (self.moveDown) {
            self.motion.direction = Direction.Down;
        }
    });
}