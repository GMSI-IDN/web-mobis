// In-memory sliding-window rate limiter. Per-process only: state is not
// shared across replicas and resets on restart. Acceptable for the current
// single-instance deployment; revisit with a shared store (e.g. Redis) if
// this app is ever horizontally scaled.

const hits = new Map<string, number[]>()

let lastPrune = Date.now()
const PRUNE_INTERVAL_MS = 5 * 60 * 1000

function pruneIfDue(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now

  for (const [key, timestamps] of hits) {
    if (!timestamps.length || now - timestamps[timestamps.length - 1] > PRUNE_INTERVAL_MS) {
      hits.delete(key)
    }
  }
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  pruneIfDue(now)

  const windowStart = now - windowMs
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= limit) {
    const retryAfterMs = timestamps[0] + windowMs - now
    hits.set(key, timestamps)
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) }
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return { allowed: true, retryAfterMs: 0 }
}
