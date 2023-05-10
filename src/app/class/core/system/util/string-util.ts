export enum CompareOption {
  None = 0,
  IgnoreCase = 1,
  IgnoreWidth = 2,
}

export namespace StringUtil {
  export function toHalfWidth(str: string): string {
    return str.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  }

  export function equals(str1: string, str2: string, option: CompareOption = CompareOption.None): boolean {
    return str1.length === str2.length && (str1 === str2 || normalize(str1, option) === normalize(str2, option));
  }

  export function normalize(str: string, option: CompareOption): string {
    if (option === CompareOption.None) return str;
    let normalize = str;

    if (option & CompareOption.IgnoreCase) normalize = normalize.toLocaleLowerCase();
    if (option & CompareOption.IgnoreWidth) normalize = toHalfWidth(normalize);

    return normalize;
  }
}
