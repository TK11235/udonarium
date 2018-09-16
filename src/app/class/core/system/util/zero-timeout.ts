let i: number = 0;
const timeouts = {};
const channel = new MessageChannel();

export function setZeroTimeout(fn): number {
  if (i === 0x100000000) // max queue size
    i = 0;
  if (++i in timeouts) throw new Error('setZeroTimeout queue overflow.');
  timeouts[i] = fn;
  channel.port2.postMessage(i);
  return i;
}

export function clearZeroTimeout(id: number) {
  delete timeouts[id];
}

channel.port1.onmessage = function (ev) {
  let fn = timeouts[ev.data];
  if (fn) {
    delete timeouts[ev.data];
    fn();
  }
}

channel.port1.start();
channel.port2.start();
