let i: number = 0;
const timeouts = new Map<number, Function>();
const channel = new MessageChannel();

export function setZeroTimeout(fn: Function): number {
  if (i === 0x100000000) // max queue size
    i = 0;
  if (++i in timeouts) throw new Error('setZeroTimeout queue overflow.');
  timeouts.set(i, fn);
  channel.port2.postMessage(i);
  return i;
}

export function clearZeroTimeout(id: number) {
  timeouts.delete(id);
}

channel.port1.onmessage = function (ev) {
  const fn = timeouts.get(ev.data);
  timeouts.delete(ev.data);
  if (fn) fn();
}

channel.port1.start();
channel.port2.start();
