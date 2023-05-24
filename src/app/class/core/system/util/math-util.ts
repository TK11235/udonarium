export namespace MathUtil {
  export interface Coordinate {
    x: number;
    y: number;
    z?: number;
  }

  export function sqrMagnitude(a: Coordinate, b: Coordinate = { x: 0, y: 0, z: 0 }): number {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z ?? 0) - (b.z ?? 0)) ** 2;
  }

  export function clampMin(value: number, min: number = 0): number {
    return value < min ? min : value;
  }

  export function clampMax(value: number, max: number = 100): number {
    return value < max ? value : max;
  }

  export function radians(angleDegree: number): number {
    return angleDegree * Math.PI / 180;
  }

  export function degrees(angleRadian: number): number {
    return angleRadian * 180 / Math.PI;
  }
}
