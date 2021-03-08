import * as WordArray from 'crypto-js/lib-typedarrays';
import * as SHA256 from 'crypto-js/sha256';

export namespace FileReaderUtil {
  export function readAsArrayBufferAsync(blob: Blob): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result as ArrayBuffer); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      reader.readAsArrayBuffer(blob);
    });
  }

  export function readAsTextAsync(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result as string); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      reader.readAsText(blob);
    });
  }

  export async function calcSHA256Async(arrayBuffer: ArrayBuffer): Promise<string>
  export async function calcSHA256Async(blob: Blob): Promise<string>
  export async function calcSHA256Async(arg: any): Promise<string> {
    if (arg instanceof Blob) {
      return _calcSHA256Async(arg);
    } else {
      return _calcSHA256(arg);
    }
  }

  async function _calcSHA256Async(blob: Blob): Promise<string> {
    return _calcSHA256(await FileReaderUtil.readAsArrayBufferAsync(blob));
  }

  function _calcSHA256(arrayBuffer: ArrayBuffer): string {
    let wordArray = WordArray.create(arrayBuffer as any);
    return SHA256(wordArray).toString();
  }
}
