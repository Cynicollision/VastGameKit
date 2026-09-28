export class GameError extends Error {
    private _innerError?: Error;
    get innerError() { return this._innerError; }

    constructor(message: string, innerError?: Error) {
        super(message);
        this.name = 'GameError';
        this._innerError = innerError;
    }
}