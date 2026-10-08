// In-memory fixed-window rate limiter. State lives in the server process, so it
// resets on restart and is not shared between instances — enough for a
// single-user site with no database.

type Bucket = { count: number; resetAt: number }

// Expired buckets are swept once the map grows past this, so spoofed keys
// can't grow memory without bound.
const PRUNE_THRESHOLD = 1000

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>()

  function prune(now: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }

  return {
    /** Seconds until `key` may try again, or 0 when it isn't blocked. */
    retryAfter(key: string) {
      const now = Date.now()
      const bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= now || bucket.count < limit) return 0
      return Math.ceil((bucket.resetAt - now) / 1000)
    },

    hit(key: string) {
      const now = Date.now()
      if (buckets.size > PRUNE_THRESHOLD) prune(now)
      const bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs })
      } else {
        bucket.count++
      }
    },

    reset(key: string) {
      buckets.delete(key)
    },
  }
}
