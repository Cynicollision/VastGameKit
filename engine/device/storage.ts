function getLocalStorage(): Storage | null {
    try {
        // throws in some browsers when site data is blocked.
        return window.localStorage;
    }
    catch {
        return null;
    }
}

// Saves JSON values, like high scores or settings, that persist between visits. Keys are prefixed with the game's name
// to keep them separate from other games on the same site. When the browser won't store data (e.g. private browsing),
// values are kept only until the page is closed.
export class GameStorage {
    readonly prefix: string;

    private readonly storage: Storage | null;
    private readonly memory = new Map<string, string>();

    // Values are saved to storage, or only kept in memory if it's null.
    constructor(name: string, storage: Storage | null = getLocalStorage()) {
        this.prefix = `${name}.`;
        this.storage = storage;
    }

    private read(key: string): string | null {
        const memoryValue = this.memory.get(key);
        if (memoryValue !== undefined) {
            return memoryValue;
        }

        try {
            return this.storage ? this.storage.getItem(this.prefix + key) : null;
        }
        catch {
            return null;
        }
    }

    // The saved value, or defaultValue if there's none or it can't be read.
    get<T>(key: string, defaultValue: T): T {
        const text = this.read(key);

        if (text === null) {
            return defaultValue;
        }

        try {
            return JSON.parse(text);
        }
        catch {
            return defaultValue;
        }
    }

    has(key: string): boolean {
        return this.read(key) !== null;
    }

    remove(key: string): void {
        this.memory.delete(key);

        try {
            if (this.storage) {
                this.storage.removeItem(this.prefix + key);
            }
        }
        catch {
            // nothing was stored.
        }
    }

    // Saves a value, returning whether it will persist between visits.
    set(key: string, value: unknown): boolean {
        const text = JSON.stringify(value);

        try {
            if (this.storage) {
                this.storage.setItem(this.prefix + key, text);
                this.memory.delete(key);
                return true;
            }
        }
        catch {
            // e.g. storage is full or blocked; keep the value for this visit.
        }

        this.memory.set(key, text);
        return false;
    }
}
