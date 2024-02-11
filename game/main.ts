import { VastGameKit } from './../engine/vastgamekit';
import { Direction } from './../engine/actor';
import { SpriteTransformation } from '../engine/sprite/sprite';

const game = VastGameKit.init({ canvasElementId: 'gameCanvas' });

const spr1 = game.defineSprite('sprite1', './resources/playerShip3_blue.png');
const act1 = game.defineActor('actor1', { sprite: spr1 });
act1.useBasicMotionBehavior();

// Actor1
act1.onCreate((self, state) => {
    console.log('act1.onCreate');
    act1.setBoundaryFromSprite(); // TODO make possible to do outside of lifecycle, i.e. load image if its not already loaded

    self.stats = { health: 100 };
});

act1.onStep((self, state) => {

    if (self.moveUp || self.moveLeft || self.moveRight || self.moveDown) {
        self.motion.speed = 4;
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

act1.onPointerInput('mousedown', (self, state, event) => {
    console.log('you clicked me');
    state.raiseEvent('something', { foo: 'bar'});
    //self.destroy();
});

act1.onKeyboardInput('w', (self, state, event) => {
    self.moveUp = event.type === 'keydown';
});

act1.onKeyboardInput('a', (self, state, event) => {
    self.moveLeft = event.type === 'keydown';
});

act1.onKeyboardInput('s', (self, state, event) => {
    self.moveDown = event.type === 'keydown';
});

act1.onKeyboardInput('d', (self, state, event) => {
    self.moveRight = event.type === 'keydown';
});

act1.onGameEvent('something', (self, state, event) => {
    console.log('act1.onGameEvent.something');
    console.log('act1.onGameEvent.something data = '+event.data);

    state.goToRoom(state.currentRoom.name === 'default' ? 'room1' : 'default');
    event.cancel();
});

act1.onDestroy((self, state) => {
    console.log('act1.onDestroy');
});

// DefaultRoom
game.defaultRoom.onStart((self, state) => {
    

    console.log('defaultRoom.onStart');
    const player = self.createInstance('actor1', 256, 256);
    self.camera.follow(player, 300, 300);
});

game.defaultRoom.onGameEvent('something', (self, state, event) => {
    console.log('game.defaultRoom.onGameEvent.something!');
    console.log('game.defaultRoom.onGameEvent.something data = '+event.data);
    //event.cancel();
});

game.defaultRoom.defaultLayer.setBackground(game.defineSprite('sky', './resources/sky.png'));

game.defaultRoom.defaultLayer.onCreate((self, state) => {
    console.log('defaultRoom.defaultLayer.onCreate');
})

// Room1
const room1 = game.defineRoom('room1', { persistent: true });
room1.setBackground('#C00');

const hud = room1.createLayer('hud', { height: 64, width: 800, x: 16, y: 16 });
hud.setBackground(game.getSprite('sky'));

room1.onStart((self, state) => {
    console.log('room1.onStart');
    const one = self.createInstance('actor1', 32, 96);
    one.animation.setTransform(SpriteTransformation.Opacity, 0.5);
});

room1.onResume((self, state) => {
    console.log('room1.onResume');
})

room1.defaultLayer.onCreate((self, state) => {
    console.log('room1.defaultLayer.onCreate');

    hud.createInstance('actor1', 32, 32);
});

// load and start the game
game.load().then(() => {
    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});
