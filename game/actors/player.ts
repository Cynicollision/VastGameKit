import { Direction, SpriteTransformation } from './../../engine/core/enum';
import { Game } from './../../engine/game';

export function buildPlayerActor(game: Game) {
    
    const player = game.defineActor('actPlayer', { 
        sprite: game.defineSprite('sprPlayer', './resources/granite.png') 
    });

    player.useBasicMotionBehavior();

    player.onLoad(player => {
        player.setRectBoundaryFromSprite();
    });

    player.onCreate((self, gc) => {
        self.state.stats = { health: 100 };
        self.animation.setTransform(SpriteTransformation.Opacity, 0.5);
        gc.state.message = ' :)';
    });

    player.onGameEvent('something', (self, ev, sc) => {
        const nextRoom = sc.scene.name === 'default' ? 'room1' : 'default';
        sc.transitionToScene(nextRoom, { durationMs: 500 });
        ev.cancel();
    });

    player.onCollision('actCoin', (self, other, sc) => {
        //other.destroy();
    });
    
    player.onKeyboardInput('w', (self, ev, sc) => {
        // TODO: define in (new) ActorKeyboardControlBehavior
        self.state.moveUp = ev.type === 'keydown';
    });

    player.onKeyboardInput('a', (self, ev, sc) => {
        self.state.moveLeft = ev.type === 'keydown';
    });

    player.onKeyboardInput('s', (self, ev, sc) => {
        self.state.moveDown = ev.type === 'keydown';
    });

    player.onKeyboardInput('d', (self, ev, sc) => {
        self.state.moveRight = ev.type === 'keydown';
    });

    player.onPointerInput('mousedown', (self, ev, sc) => {
        console.log('you clicked me');
        sc.publishEvent('something', { foo: 'bar'});
    });

    player.onStep((self, sc) => {
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

    player.onDraw((self, canvas, sc) => {
        canvas.drawText(`(${self.x},${self.y})`, self.x + 100, self.y + 10);
    });
}