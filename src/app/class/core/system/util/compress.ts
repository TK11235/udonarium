import * as Pako from 'pako';

import { setZeroTimeout } from './zero-timeout';

export async function compressAsync(data: Uint8Array, chunkSize?: number): Promise<Uint8Array> {
  const deflate = new Pako.Deflate({ level: 2, gzip: true });

  try {
    await processAsync(deflate, data, chunkSize);
    return deflate.result as Uint8Array;
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function decompressAsync(data: Uint8Array, chunkSize?: number): Promise<Uint8Array> {
  const inflate = new Pako.Inflate();

  try {
    await processAsync(inflate, data, chunkSize);
    return inflate.result as Uint8Array;
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function processAsync<T extends Pako.Deflate | Pako.Inflate>(pakoObj: T, data: Uint8Array, chunkSize: number = 16 * 1024): Promise<T> {
  let total = Math.ceil(data.byteLength / chunkSize);
  let sliceData: Uint8Array = null;

  for (let sliceIndex = 0; sliceIndex < total; sliceIndex++) {
    await waitTickAsync();
    sliceData = data.slice(sliceIndex * chunkSize, (sliceIndex + 1) * chunkSize);
    pakoObj.push(sliceData, total <= sliceIndex + 1);
  }

  if (pakoObj.err) throw new Error(`error: ${pakoObj.err}`);
  return pakoObj;
}

function waitTickAsync() {
  return new Promise(resolve => setZeroTimeout(() => resolve()));
}
