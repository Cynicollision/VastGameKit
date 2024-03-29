export class GameEvent {
    private _name: string;
    get name(): string { return this._name; }

    private _isCancelled: boolean = false;
    get isCancelled() { return this._isCancelled; }

    private _data: any;
    get data() { return this._data; }

    constructor(name: string, data?: any) {
        this._name = name;
        this._data = data;
        this._isCancelled = false;
    }

    cancel(): void {
        this._isCancelled = true;
    }
}
