export async function compressAsync(data: Uint8Array): Promise<Uint8Array> {
  return processAsync(new CompressionStream('gzip'), data);
}

export async function decompressAsync(data: Uint8Array): Promise<Uint8Array> {
  return processAsync(new DecompressionStream('gzip'), data);
}

async function processAsync(transform: ReadableWritablePair, data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
