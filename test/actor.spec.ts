
import { Actor } from './../engine/actor';
import { Game } from './../engine/game/game';
import { GameEvent } from './../engine/game/event';
import { TestImage } from './mocks/testImage';
import { TestUtil } from './testUtil';

describe('Actor', () => {
    let testGame: Game;
    let testActor: Actor;

    beforeEach(() => {
        testGame = TestUtil.getTestGame();
        testActor = testGame.defineActor('testActor');
    });

    describe('lifecycle callbacks', () => {
        // TODO callCreate, callEvent, callPointerInput, callKeyboardInput, callDraw, callDestroy
        it('NEEDS TESTS', () => {

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
        testActor.callEvent(null, TestUtil.getTestState(testGame), event);

        expect(handlerCalled).toBeTrue();
        expect(dataFromEvent).toBe(123);
    });
});
