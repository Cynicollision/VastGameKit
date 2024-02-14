
import { Actor } from './../engine/actor';
import { Game, GameEvent, GameState } from './../engine/game';
import { Room } from './../engine/room';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Actor', () => {
    let testGame: Game;
    //let testState: GameState;
    let testActor: Actor;
    let testRoom: Room;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        //testState = TestUtil.getTestState(testGame);
        testActor = testGame.defineActor('testActor');
        testRoom = testGame.defineRoom('testRoom');
    });

    describe('lifecycle callbacks', () => {

        it('defines an onCreate callback', () => {
            let onCreateCalled = false;
            testActor.onCreate((self, state) => {
                onCreateCalled = true;
            });

            expect(onCreateCalled).toBeFalse();
            
            testActor.callCreate(null, null)

            expect(onCreateCalled).toBeTrue();
        });

        it('defines a collsion handler callback', () => {
            let collisionHandlerCalled = false;
            testGame.defineActor('actor2');
            const instance2 = testRoom.defaultLayer.createInstance('actor2');

            testActor.onCollision('actor2', (self, other, state) => {
                collisionHandlerCalled = true;
            });

            expect(collisionHandlerCalled).toBeFalse();

            testActor.callCollision(null, instance2, null);
            
            expect(collisionHandlerCalled).toBeTrue();
        });

        it('defines a game event handler callback', () => {
            let gameEventHandlerCalled = false;
            testActor.onGameEvent('testEvent', (self, state, event) => {
                gameEventHandlerCalled = true;
            });

            expect(gameEventHandlerCalled).toBeFalse();

            testActor.callGameEvent(null, null, new GameEvent('testEvent'));

            expect(gameEventHandlerCalled).toBeTrue();
        });

        xit('defines a pointer event handler callback', () => {
            // TODO
        });

        xit('defines a keyboard event handler callback', () => {
            // TODO
        });

        xit('defines an onStep callback', () => {
            // TODO
        });

        xit('defines an onDraw callback', () => {
            // TODO
        });

        xit('defines an onDestroy callback', () => {
            // TODO
        });
    });

    it('sets its boundary to the size of its Sprite', (done) => {
        expect(testActor.boundary).toBeUndefined();

        testActor.sprite = testGame.defineSprite('testSprite', TestImage.Source);
        testActor.sprite.load().then(() => {
            const boundary = testActor.setBoundaryFromSprite();

            expect(testActor.boundary).toBe(boundary);
            expect(boundary.height).toBe(TestImage.Height);
            expect(boundary.width).toBe(TestImage.Width);

            done();
        });
    });

    it('handles raised game events it subscribes to', () => {
        let handlerCalled = false;
        let dataFromEvent = null;

        testActor.onGameEvent('testEvent', (self, state, event) => {
            handlerCalled = true;
            dataFromEvent = event.data.value;
        });

        expect(handlerCalled).toBeFalse();
        expect(dataFromEvent).toBeNull();

        const event = new GameEvent('testEvent', { value: 123 });
        testActor.callGameEvent(null, TestUtil.getTestState(testGame), event);

        expect(handlerCalled).toBeTrue();
        expect(dataFromEvent).toBe(123);
    });
});
