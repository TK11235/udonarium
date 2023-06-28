import { CryptoUtil } from '../system/util/crypto-util';

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
      return CryptoUtil.sha256Hex(await FileReaderUtil.readAsArrayBufferAsync(arg));
    } else {
      return CryptoUtil.sha256Hex(arg);
    }
  }
}
