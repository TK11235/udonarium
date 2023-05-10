export namespace StringUtil {
  export function toHalfWidth(str: string): string {
    return str.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  }
}
