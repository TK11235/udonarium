import { setZeroTimeout } from './zero-timeout';

export function waitTickAsync(): Promise<void> {
  return new Promise(resolve => setZeroTimeout(resolve));
}
