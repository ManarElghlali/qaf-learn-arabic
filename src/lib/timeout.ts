// Native plugin calls and network requests can stall (no store connection, a plugin that never answers).
// Every awaited call that keeps a button disabled goes through here so the control always unlocks.
export class TimeoutError extends Error {
  constructor(label: string) { super(`${label} timed out`); this.name = "TimeoutError"; }
}

export function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new TimeoutError(label)), ms); });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}
