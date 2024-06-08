export class RuntimeID {
    private static current = 0;

    static next(): number {
        return ++this.current;
    }
}