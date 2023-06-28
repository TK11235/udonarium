import * as WordArray from 'crypto-js/lib-typedarrays';
import * as SHA256 from 'crypto-js/sha256';

export namespace CryptoUtil {
  export function sha256(arrayBuffer: ArrayBuffer): ArrayBuffer
  export function sha256(str: string): ArrayBuffer
  export function sha256(arg: any): ArrayBuffer {
    let hash: WordArray;
    if (arg instanceof ArrayBuffer) {
      let wordArray = WordArray.create(arg as any);
      hash = SHA256(wordArray);
    } else {
      hash = SHA256(arg);
    }
    return Uint32Array.from(hash.words).buffer;
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
    let arrayBuffer = Uint32Array.from(hash.words).buffer;
    let base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '');
    return base64;
  }
}
