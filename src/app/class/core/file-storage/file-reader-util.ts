export namespace FileReaderUtil {
  export function readAsArrayBufferAsync(blob: Blob): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      reader.readAsArrayBuffer(blob);
    });
  }

  export function readAsTextAsync(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = event => { resolve(reader.result); }
      reader.onabort = reader.onerror = (e) => { reject(e); }
      reader.readAsText(blob);
    });
  }
}
