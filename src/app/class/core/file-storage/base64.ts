export namespace Base64 {
  export function toBlob(base64: string): Blob {
    let tmp = base64.split(',');
    let data = null;
    try {
      data = atob(tmp[1]);
    } catch (error) {
      console.warn(error);
      return null;
    }
    let mime = tmp[0].split(':')[1].split(';')[0];
    if (mime.length < 1) return null;
    let arr = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) { arr[i] = data.charCodeAt(i); }
    let blob = new Blob([arr], { type: mime });
    return blob;
  }

  export function toBase64Async(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        resolve(reader.result as string);
      }
      reader.onabort = reader.onerror = () => {
        reject();
      }
      reader.readAsDataURL(blob);
    });
  }
}