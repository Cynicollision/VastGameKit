import { GameStorage } from './../engine/device/storage';
import { TestUtil } from './testUtil';

class MemoryStorage implements Storage {
    readonly items = new Map<string, string>();
    full = false;

    get length(): number { return this.items.size; }
    clear(): void { this.items.clear(); }
    getItem(key: string): string | null { return this.items.has(key) ? this.items.get(key)! : null; }
    key(index: number): string | null { return Array.from(this.items.keys())[index] || null; }
    removeItem(key: string): void { this.items.delete(key); }
    setItem(key: string, value: string): void {
        if (this.full) {
            throw new DOMException('full', 'QuotaExceededError');
        }
        this.items.set(key, value);
    }
}

class BlockedStorage extends MemoryStorage {
    getItem(): string | null { throw new DOMException('blocked', 'SecurityError'); }
    setItem(): void { throw new DOMException('blocked', 'SecurityError'); }
    removeItem(): void { throw new DOMException('blocked', 'SecurityError'); }
}

describe('GameStorage', () => {
    let backing: MemoryStorage;
    let storage: GameStorage;

    beforeEach(() => {
        backing = new MemoryStorage();
        storage = new GameStorage('stackmo', backing);
    });

    it('saves JSON values under the game name', () => {
        expect(storage.set('highScores', [{ name: 'SN', score: 1200 }])).toBeTrue();

        expect(backing.items.get('stackmo.highScores')).toBe('[{"name":"SN","score":1200}]');
        expect(storage.get<{ name: string; score: number }[]>('highScores', [])).toEqual([{ name: 'SN', score: 1200 }]);
        expect(storage.has('highScores')).toBeTrue();
    });

    it('keeps games with different names separate', () => {
        const otherGame = new GameStorage('poker', backing);
        storage.set('best', 10);

        expect(otherGame.get('best', 0)).toBe(0);
    });

    it('returns the default for missing or unreadable values', () => {
        backing.setItem('stackmo.broken', '{not json');

        expect(storage.get('missing', 5)).toBe(5);
        expect(storage.get('broken', 'default')).toBe('default');
        expect(storage.has('missing')).toBeFalse();
    });

    it('removes values', () => {
        storage.set('level', 3);
        storage.remove('level');

        expect(storage.get('level', 1)).toBe(1);
        expect(backing.items.size).toBe(0);
    });

    it('keeps values for the visit when storage is full', () => {
        storage.set('level', 1);
        backing.full = true;

        expect(storage.set('level', 2)).toBeFalse();
        expect(storage.get('level', 0)).toBe(2);
    });

    it('keeps values for the visit when storage is blocked or unavailable', () => {
        for (const unavailable of [new GameStorage('stackmo', new BlockedStorage()), new GameStorage('stackmo', null)]) {
            expect(unavailable.get('level', 0)).toBe(0);
            expect(unavailable.set('level', 4)).toBeFalse();
            expect(unavailable.get('level', 0)).toBe(4);
            unavailable.remove('level');
            expect(unavailable.has('level')).toBeFalse();
        }
    });

    it('is available to the game through the controller', () => {
        const testGame = TestUtil.getTestGame();

        testGame.controller.storage.set('coins', 7);

        expect(testGame.controller.storage.get('coins', 0)).toBe(7);
    });
});
