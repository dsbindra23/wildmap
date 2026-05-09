// In-memory rate limiter — per serverless instance, good enough to stop casual abuse
// Each entry: [count, windowStartMs]
const store = new Map<string, [number, number]>();
const CLEANUP_INTERVAL = 60_000;

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, [, start]] of store) {
    if (now - start > CLEANUP_INTERVAL) store.delete(key);
  }
}

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  maybeCleanup();
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now - entry[1] > windowMs) {
    store.set(ip, [1, now]);
    return true;
  }
  if (entry[0] >= limit) return false;
  entry[0]++;
  return true;
}
