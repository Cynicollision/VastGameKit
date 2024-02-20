import { Game } from './game';
import { GameCanvas } from './../device';
import { GameEvent } from './event';
import { Room, RoomTransition, RoomTransitionFactory, RoomTransitionOptions, RoomTransitionType } from './../room';

export class GameState {
    private _currentRoom: Room;
    get currentRoom() { return this._currentRoom; }

    private _game: Game;
    get game() { return this._game; }

    private _eventQueue: GameEvent[] = [];
    private _transition: RoomTransition;

    // allow properties to dynamically be assigned to GameState.
    [x: string | number | symbol]: unknown;

    constructor(game: Game) {
        this._game = game;
    }

    init(roomName: string): void {
        this.setCurrentRoom(this.game.getRoom(roomName));
    }

    goToRoom(roomName: string): void {
        this.suspendCurrentRoom();
        this.setCurrentRoom(this.game.getRoom(roomName));
    }

    transitionToRoom(roomName: string, options: RoomTransitionOptions = {}, transitionType: RoomTransitionType = RoomTransitionType.Fade): void {
        this.suspendCurrentRoom();
        this._transition = RoomTransitionFactory.new(transitionType, options);
        this._transition.start(() => {
            this.setCurrentRoom(this.game.getRoom(roomName));
        }, () => {
            this._transition = null;
        });
    }

    private setCurrentRoom(room: Room): void {
        room.init();
        this._currentRoom = room;
    }

    private suspendCurrentRoom(): void {
        if (this._currentRoom) {
            this._currentRoom.suspend(this);
        }
    }

    raiseEvent(eventName: string, data?: any): void {
        this._eventQueue.push(new GameEvent(eventName, data));
    }

    getQueuedEvents(): GameEvent[] {
        return this._eventQueue;
    }

    flushEventQueue(): GameEvent[] {
        const queue = this._eventQueue;
        this._eventQueue = [];

        return queue;
    }

    drawTransition(canvas: GameCanvas): void {
        if (this._currentRoom && this._transition) {
            this._transition.draw(this._currentRoom, canvas);
        }
    }
}
