import { Direction, SpriteTransformation } from './../../engine/core/enum';
import { Game } from './../../engine/game';

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
    .onGameEvent('something', (self, ev, sc) => {
        const nextRoom = sc.scene.name === 'default' ? 'room1' : 'default';
        sc.transitionToScene(nextRoom, { durationMs: 500 });
        ev.cancel();
    })
    .onCollision('actCoin', (self, other, sc) => {
        //other.destroy();
    })
    .onKeyboardInput('w', (self, ev, sc) => {
        // TODO: define in (new) ActorKeyboardControlBehavior
        self.state.moveUp = ev.type === 'keydown';
    })
    .onKeyboardInput('a', (self, ev, sc) => {
        self.state.moveLeft = ev.type === 'keydown';
    })
    .onKeyboardInput('s', (self, ev, sc) => {
        self.state.moveDown = ev.type === 'keydown';
    })
    .onKeyboardInput('d', (self, ev, sc) => {
        self.state.moveRight = ev.type === 'keydown';
    })
    .onPointerInput('mousedown', (self, ev, sc) => {
        console.log('you clicked me');
        sc.raiseEvent('something', { foo: 'bar'});
    })
    .onStep((self, sc) => {
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
    })
    .onDraw((self, canvas, sc) => {
        canvas.drawText(`(${self.x},${self.y})`, self.x + 100, self.y + 10);
    });
}