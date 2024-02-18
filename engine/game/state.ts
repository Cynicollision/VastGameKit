import { Game } from './game';
import { GameEvent } from './event';
import { Room } from './../room';

export class GameState {
    private _currentRoom: Room;
    get currentRoom() { return this._currentRoom; }

    private _game: Game;
    get game() { return this._game; }

    private _eventQueue: GameEvent[] = [];

    // allow properties to dynamically be assigned to GameState.
    [x: string | number | symbol]: unknown;

    constructor(game: Game) {
        this._game = game;
    }

    init(roomName: string): void {
        this._currentRoom = this.game.getRoom(roomName);
        this._currentRoom.init();
    }

    goToRoom(roomName: string): void {
        if (this._currentRoom) {
            this._currentRoom.suspend(this);
        }

        const room = this.game.getRoom(roomName);
        room.init();
        this._currentRoom = room;
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
}
