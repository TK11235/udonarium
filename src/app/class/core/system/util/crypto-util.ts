import WordArray from 'crypto-js/lib-typedarrays';
import SHA256 from 'crypto-js/sha256';

export namespace CryptoUtil {
  export function sha256(arrayBuffer: ArrayBuffer): Uint8Array
  export function sha256(str: string): Uint8Array
  export function sha256(arg: any): Uint8Array {
    let hash: WordArray;
    if (arg instanceof ArrayBuffer) {
      let wordArray = WordArray.create(arg as any);
      hash = SHA256(wordArray);
    } else {
      hash = SHA256(arg);
    }
    return toUint8Array(hash);
  }

  export function sha256Hex(arrayBuffer: ArrayBuffer): string
  export function sha256Hex(str: string): string
  export function sha256Hex(arg: any): string {
    if (arg instanceof ArrayBuffer) {
      let wordArray = WordArray.create(arg as any);
      return SHA256(wordArray).toString();
    } else {
      return SHA256(arg).toString();
    }
  }

  export function sha256Base64Url(str: string): string {
    if (str == null) return '';
    let hash = SHA256(str);
    let uint8Array = toUint8Array(hash);
    let base64 = btoa(String.fromCharCode(...uint8Array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '');
    return base64;
  }

  function toUint8Array(wordArray: WordArray) {
    let uint8Array = new Uint8Array(wordArray.words.length << 2);
    let offset = 0;
    for (let word of wordArray.words) {
      uint8Array[offset++] = (word & 0xff000000) >>> 24;
      uint8Array[offset++] = (word & 0x00ff0000) >>> 16;
      uint8Array[offset++] = (word & 0x0000ff00) >>> 8;
      uint8Array[offset++] = (word & 0x000000ff);
    }
    return uint8Array;
  }
}
