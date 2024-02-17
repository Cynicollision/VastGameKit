export class MathUtil {

    static clamp(input, min, max) {
        return input <= min ? min : input >= max ? max : input;
      }

    static getLengthDirectionX(length: number, direction: number): number {
        return length * Math.cos(direction * (Math.PI / 180));
    }

    static getLengthDirectionY(length: number, direction: number) {
        return length * Math.sin(direction * (Math.PI / 180));
    }
}