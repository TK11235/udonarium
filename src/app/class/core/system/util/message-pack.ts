import * as msgpacklite from 'msgpack-lite';

export namespace MessagePack {
  export function encode(object: unknown): Uint8Array {
    try {
      return msgpacklite.encode(object);
    } catch (error) {
      console.error(error, object);
    }
    return null;
  }

  export function decode(buffer: Uint8Array): unknown {
    try {
      return msgpacklite.decode(buffer);
    } catch (error) {
      console.error(error, buffer);
    }
    return null;
  }
}
